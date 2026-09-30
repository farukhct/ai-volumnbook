/**
 * VolumnBook — CSV Import Facility Module
 * Enterprise-grade CSV file import wizard:
 * - Drag & drop or file upload (.csv, .tsv, .txt)
 * - Intelligent delimiter auto-detection (comma, semicolon, tab, pipe)
 * - Smart column header auto-mapping
 * - Multi-format date parsing & normalization (dd-MM-yyyy, YYYY-MM-DD, Excel serials)
 * - In-depth duplicate checking against local database and internal CSV rows
 * - Live interactive preview table with validation badges and issue filters
 * - 3 import strategies: Append (skip duplicates), Merge & Upsert, Clean & Replace
 * - Automatic safety backup creation
 * - Downloadable sample CSV template & 1-click test demo loader
 */

import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Download,
  ArrowRight,
  ArrowLeft,
  Database,
  Sparkles,
  Check,
  X,
  Filter,
  ShieldCheck,
  TableProperties,
  RotateCcw,
  Info,
  Copy,
} from 'lucide-react';
import {
  ColumnMapping,
  ImportMode,
  NavigationModule,
  ParsedImportRow,
  ImportSummary,
} from '../types';
import { db } from '../lib/database';
import {
  parseCsvText,
  autoDetectColumnMapping,
  processImportRows,
  downloadSampleCsv,
  generateSampleCsv,
} from '../lib/csvUtils';
import { formatToDisplayDate } from '../lib/dateUtils';
import { useToast } from '../components/Toast';

interface ImportViewProps {
  onNavigate: (module: NavigationModule) => void;
  onImportComplete?: () => void;
}

type WizardStep = 'upload' | 'mapping' | 'preview' | 'complete';

export const ImportView: React.FC<ImportViewProps> = ({
  onNavigate,
  onImportComplete,
}) => {
  const { showToast } = useToast();

  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>('upload');
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<number>(0);
  const [rawCsvText, setRawCsvText] = useState<string>('');
  const [delimiter, setDelimiter] = useState<string>(',');

  // CSV parsed data
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]);

  // Column mapping
  const [mapping, setMapping] = useState<ColumnMapping>({
    caseNo: '',
    judgementDate: '',
    draftDate: '',
    finalDate: '',
    sendToSectionDate: '',
    remarks: '',
    serialNo: '',
  });

  // Database existing case numbers for real-time duplicate detection
  const [existingCaseNumbers, setExistingCaseNumbers] = useState<Set<string>>(new Set());

  // Import options
  const [importMode, setImportMode] = useState<ImportMode>('append_allow_duplicates');
  const [allowDuplicates, setAllowDuplicates] = useState<boolean>(true);
  const [createSafetyBackup, setCreateSafetyBackup] = useState<boolean>(true);
  const [keepSerialNo, setKeepSerialNo] = useState<boolean>(true);

  // Preview filtering & pagination
  const [filterTab, setFilterTab] = useState<'all' | 'valid' | 'duplicates' | 'warnings' | 'errors'>('all');
  const [previewPage, setPreviewPage] = useState<number>(1);
  const pageSize = 15;

  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);

  // Drag & drop state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing database case numbers on mount
  useEffect(() => {
    const existing = db.findExistingCaseNumbers();
    setExistingCaseNumbers(existing);
  }, []);

  // Handle incoming raw file
  const handleFileContent = (name: string, size: number, text: string) => {
    setFileName(name);
    setFileSize(size);
    setRawCsvText(text);

    const parsed = parseCsvText(text);
    setDelimiter(parsed.detectedDelimiter);
    setHeaders(parsed.headers);
    setRawRows(parsed.rows);

    const suggested = autoDetectColumnMapping(parsed.headers);
    setMapping(suggested);

    if (parsed.headers.length > 0 && parsed.rows.length > 0) {
      setCurrentStep('mapping');
      showToast(`Parsed ${parsed.rows.length} rows with ${parsed.headers.length} columns.`, 'info');
    } else {
      showToast('The selected file appears to be empty or missing data rows.', 'error');
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      handleFileContent(file.name, file.size, content);
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      handleFileContent(file.name, file.size, content);
    };
    reader.readAsText(file);
  };

  // 1-Click Load Demo Template Data
  const handleLoadDemoData = () => {
    const demoCsv = generateSampleCsv();
    handleFileContent('VolumnBook_Demo_Cases.csv', demoCsv.length, demoCsv);
    showToast('Demo case volume data loaded successfully.', 'success');
  };

  // When delimiter changes manually in mapping view
  const handleDelimiterChange = (newDelim: string) => {
    setDelimiter(newDelim);
    if (rawCsvText) {
      const parsed = parseCsvText(rawCsvText, newDelim);
      setHeaders(parsed.headers);
      setRawRows(parsed.rows);
      setMapping(autoDetectColumnMapping(parsed.headers));
    }
  };

  // Process rows with current mapping
  const parsedRows: ParsedImportRow[] = useMemo(() => {
    if (!rawRows.length || !headers.length) return [];
    return processImportRows(rawRows, headers, mapping, existingCaseNumbers);
  }, [rawRows, headers, mapping, existingCaseNumbers]);

  // Validation metrics
  const stats = useMemo(() => {
    const total = parsedRows.length;
    let valid = 0;
    let warnings = 0;
    let errors = 0;
    let duplicates = 0;

    parsedRows.forEach((r) => {
      if (!r.isValid) errors++;
      else valid++;
      if (r.warnings.length > 0) warnings++;
      if (r.isDuplicate) duplicates++;
    });

    return { total, valid, warnings, errors, duplicates };
  }, [parsedRows]);

  // Filtered rows for preview
  const filteredPreviewRows = useMemo(() => {
    if (filterTab === 'valid') {
      return parsedRows.filter((r) => r.isValid && r.warnings.length === 0);
    }
    if (filterTab === 'duplicates') {
      return parsedRows.filter((r) => r.isDuplicate);
    }
    if (filterTab === 'warnings') {
      return parsedRows.filter((r) => r.warnings.length > 0);
    }
    if (filterTab === 'errors') {
      return parsedRows.filter((r) => !r.isValid);
    }
    return parsedRows;
  }, [parsedRows, filterTab]);

  const totalPreviewPages = Math.max(1, Math.ceil(filteredPreviewRows.length / pageSize));
  const paginatedPreviewRows = useMemo(() => {
    const start = (previewPage - 1) * pageSize;
    return filteredPreviewRows.slice(start, start + pageSize);
  }, [filteredPreviewRows, previewPage, pageSize]);

  // Execute the import
  const handleExecuteImport = async () => {
    if (stats.valid === 0) {
      showToast('No valid records found to import. Please check your column mapping.', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const summary = await db.bulkImport(parsedRows, importMode, {
        createSafetyBackup,
        keepSerialNo,
        allowDuplicates,
      });

      setImportSummary(summary);
      setCurrentStep('complete');
      const dupMsg = summary.duplicatesImportedCount && summary.duplicatesImportedCount > 0
        ? ` (${summary.duplicatesImportedCount} duplicates allowed)`
        : '';
      showToast(
        `Import completed: ${summary.importedCount} added${dupMsg}, ${summary.updatedCount} updated, ${summary.skippedCount} skipped.`,
        'success'
      );

      if (onImportComplete) {
        onImportComplete();
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to complete import.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset to start
  const handleReset = () => {
    setFileName('');
    setFileSize(0);
    setRawCsvText('');
    setHeaders([]);
    setRawRows([]);
    setMapping({
      caseNo: '',
      judgementDate: '',
      draftDate: '',
      finalDate: '',
      sendToSectionDate: '',
      remarks: '',
      serialNo: '',
    });
    setImportSummary(null);
    setCurrentStep('upload');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            CSV Data Import Facility
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Import case & judgement records from .csv, .tsv, or text files with smart header mapping and duplicate handling.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={downloadSampleCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-md transition-colors shadow-2xs"
            title="Download Sample CSV Template"
          >
            <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Sample Template</span>
          </button>

          <button
            onClick={() => onNavigate('all-records')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-md transition-colors shadow-2xs"
          >
            <TableProperties className="w-3.5 h-3.5 text-slate-500" />
            <span>View Records</span>
          </button>
        </div>
      </div>

      {/* Step Progress Indicators */}
      <div className="grid grid-cols-4 gap-2 bg-white dark:bg-slate-850 p-2.5 rounded-lg border border-slate-200 dark:border-slate-750 shadow-2xs text-xs">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium ${
            currentStep === 'upload'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-center text-[10px] font-bold">
            1
          </span>
          <span className="truncate">1. Select CSV</span>
        </div>

        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium ${
            currentStep === 'mapping'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-center text-[10px] font-bold">
            2
          </span>
          <span className="truncate">2. Column Mapping</span>
        </div>

        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium ${
            currentStep === 'preview'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-center text-[10px] font-bold">
            3
          </span>
          <span className="truncate">3. Review & Validate</span>
        </div>

        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium ${
            currentStep === 'complete'
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-center text-[10px] font-bold">
            4
          </span>
          <span className="truncate">4. Summary</span>
        </div>
      </div>

      {/* STEP 1: UPLOAD SCREEN */}
      {currentStep === 'upload' && (
        <div className="space-y-6">
          {/* Drag & Drop Card */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-10 text-center transition-all bg-white dark:bg-slate-850 flex flex-col items-center justify-center gap-4 ${
              isDragging
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
            }`}
          >
            <div className="p-4 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <FileSpreadsheet className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                Drag and drop your .CSV or .TXT file here
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md">
                Supports standard comma-separated files, semicolon-delimited files, and tab-delimited exports from Excel or external systems.
              </p>
            </div>

            <div className="flex items-center gap-3 mt-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,.tsv"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Browse Local CSV File</span>
              </button>

              <span className="text-xs text-slate-400">or</span>

              <button
                onClick={handleLoadDemoData}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Load Demo Dataset</span>
              </button>
            </div>

            <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              <span>Accepted: .csv, .tsv, .txt</span>
              <span>•</span>
              <span>Encodings: UTF-8, ANSI</span>
              <span>•</span>
              <span>Dates: dd-MM-yyyy, YYYY-MM-DD</span>
            </div>
          </div>

          {/* Quick Guidance Box */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-850 p-4 rounded-lg border border-slate-200 dark:border-slate-750 shadow-2xs">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Automatic Header Detection</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                The import facility will automatically match headers like &quot;Case No&quot;, &quot;Judgement Date&quot;, &quot;Draft Date&quot;, and &quot;Final Date&quot;.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-850 p-4 rounded-lg border border-slate-200 dark:border-slate-750 shadow-2xs">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Safe Duplicate Prevention</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Existing case numbers are flagged automatically. You can choose to skip duplicates, merge records, or perform a clean import.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-850 p-4 rounded-lg border border-slate-200 dark:border-slate-750 shadow-2xs">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-1">
                <Database className="w-4 h-4" />
                <span>Auto Safety Pre-Backup</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                A timestamped SQLite backup package is generated automatically prior to bulk importing to safeguard your data.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: COLUMN MAPPING SCREEN */}
      {currentStep === 'mapping' && (
        <div className="space-y-6">
          {/* File Meta Summary */}
          <div className="bg-white dark:bg-slate-850 p-4 rounded-lg border border-slate-200 dark:border-slate-750 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>{fileName || 'Imported File'}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {rawRows.length} data rows
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Size: {(fileSize / 1024).toFixed(1)} KB • {headers.length} detected columns
                </p>
              </div>
            </div>

            {/* Delimiter selector */}
            <div className="flex items-center gap-2 text-xs">
              <label className="text-slate-500 dark:text-slate-400 font-medium">Delimiter:</label>
              <select
                value={delimiter}
                onChange={(e) => handleDelimiterChange(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1 text-slate-800 dark:text-slate-200 text-xs focus:ring-1 focus:ring-blue-500"
              >
                <option value=",">Comma (,)</option>
                <option value=";">Semicolon (;)</option>
                <option value="	">Tab (\t)</option>
                <option value="|">Pipe (|)</option>
              </select>
            </div>
          </div>

          {/* Mapping Grid */}
          <div className="bg-white dark:bg-slate-850 rounded-lg border border-slate-200 dark:border-slate-750 shadow-2xs overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-750 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Target Field Mapping
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Match each VolumnBook field to the corresponding column header in your CSV file.
                </p>
              </div>
              <button
                onClick={() => setMapping(autoDetectColumnMapping(headers))}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset to Auto-match</span>
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Field mapping rows */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Case No (Required) */}
                <div className="p-3.5 rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                      <span>CASE NO</span>
                      <span className="text-red-500 font-bold">*</span>
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-normal ml-1">
                        (Required)
                      </span>
                    </label>
                    {mapping.caseNo && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 font-medium">
                        <Check className="w-3 h-3" /> Mapped
                      </span>
                    )}
                  </div>
                  <select
                    value={mapping.caseNo}
                    onChange={(e) => setMapping({ ...mapping, caseNo: e.target.value })}
                    className={`w-full bg-white dark:bg-slate-900 border rounded-md px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-blue-500 ${
                      !mapping.caseNo
                        ? 'border-red-400 dark:border-red-700'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    <option value="">-- Select Column for Case No --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Serial No (Optional) */}
                <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-900">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      SERIAL NO (Optional)
                    </label>
                    <span className="text-[10px] text-slate-400">Auto-calculated if blank</span>
                  </div>
                  <select
                    value={mapping.serialNo || ''}
                    onChange={(e) => setMapping({ ...mapping, serialNo: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">-- None / Auto-generate Sequential SerialNo --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Judgement Date */}
                <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-900">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      JUDGEMENT DATE
                    </label>
                    <span className="text-[10px] text-slate-400">dd-MM-yyyy or ISO</span>
                  </div>
                  <select
                    value={mapping.judgementDate}
                    onChange={(e) => setMapping({ ...mapping, judgementDate: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">-- None / Ignore --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Draft Date */}
                <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-900">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      DRAFT DATE
                    </label>
                    <span className="text-[10px] text-slate-400">dd-MM-yyyy or ISO</span>
                  </div>
                  <select
                    value={mapping.draftDate}
                    onChange={(e) => setMapping({ ...mapping, draftDate: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">-- None / Ignore --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Final Date */}
                <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-900">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      FINAL DATE
                    </label>
                    <span className="text-[10px] text-slate-400">dd-MM-yyyy or ISO</span>
                  </div>
                  <select
                    value={mapping.finalDate}
                    onChange={(e) => setMapping({ ...mapping, finalDate: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">-- None / Ignore --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Send to Section Date */}
                <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-900">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      SEND TO SECTION DATE
                    </label>
                    <span className="text-[10px] text-slate-400">dd-MM-yyyy or ISO</span>
                  </div>
                  <select
                    value={mapping.sendToSectionDate}
                    onChange={(e) => setMapping({ ...mapping, sendToSectionDate: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">-- None / Ignore --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Remarks (Span 2 columns) */}
                <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-900 md:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      REMARKS / NOTES
                    </label>
                    <span className="text-[10px] text-slate-400">Optional text comments</span>
                  </div>
                  <select
                    value={mapping.remarks}
                    onChange={(e) => setMapping({ ...mapping, remarks: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">-- None / Ignore --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Bottom Step Actions */}
            <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-750 flex items-center justify-between">
              <button
                onClick={() => setCurrentStep('upload')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                onClick={() => {
                  if (!mapping.caseNo) {
                    showToast('Please select a column for Case No to proceed.', 'error');
                    return;
                  }
                  setPreviewPage(1);
                  setCurrentStep('preview');
                }}
                disabled={!mapping.caseNo}
                className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-md shadow-xs transition-colors ${
                  !mapping.caseNo
                    ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                }`}
              >
                <span>Continue to Preview & Validate</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: PREVIEW & VALIDATE SCREEN */}
      {currentStep === 'preview' && (
        <div className="space-y-6">
          {/* Validation Metrics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-slate-850 p-3.5 rounded-lg border border-slate-200 dark:border-slate-750 shadow-2xs">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Total Rows</span>
              <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                {stats.total}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-850 p-3.5 rounded-lg border border-slate-200 dark:border-slate-750 shadow-2xs">
              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-[11px] font-medium">
                <span>Valid Records</span>
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                {stats.valid}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-850 p-3.5 rounded-lg border border-slate-200 dark:border-slate-750 shadow-2xs">
              <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 text-[11px] font-medium">
                <span>Warnings (Duplicates/Dates)</span>
                <AlertTriangle className="w-4 h-4" />
              </div>
              <p className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
                {stats.warnings}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-850 p-3.5 rounded-lg border border-slate-200 dark:border-slate-750 shadow-2xs">
              <div className="flex items-center justify-between text-red-600 dark:text-red-400 text-[11px] font-medium">
                <span>Errors (Unimportable)</span>
                <AlertCircle className="w-4 h-4" />
              </div>
              <p className="text-2xl font-bold font-mono text-red-600 dark:text-red-400 mt-1">
                {stats.errors}
              </p>
            </div>
          </div>

          {/* Import Strategy Card */}
          <div className="bg-white dark:bg-slate-850 p-5 rounded-lg border border-slate-200 dark:border-slate-750 shadow-2xs space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-blue-500" />
              <span>Import Strategy & Duplicate Handling</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Option 1: Append All (Allow Duplicates) - DEFAULT */}
              <label
                className={`p-3.5 rounded-lg border cursor-pointer flex flex-col justify-between transition-all ${
                  importMode === 'append_allow_duplicates' || (importMode === 'append' && allowDuplicates)
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-950 dark:text-blue-100 ring-1 ring-blue-600'
                    : 'border-slate-200 dark:border-slate-750 hover:border-slate-300 dark:hover:border-slate-650'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <input
                    type="radio"
                    name="importMode"
                    value="append_allow_duplicates"
                    checked={importMode === 'append_allow_duplicates' || (importMode === 'append' && allowDuplicates)}
                    onChange={() => {
                      setImportMode('append_allow_duplicates');
                      setAllowDuplicates(true);
                    }}
                    className="mt-0.5 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-xs font-bold block flex items-center gap-1.5">
                      <span>Append All (Allow Duplicates)</span>
                      <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase rounded bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                        Default
                      </span>
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                      Imports all rows. Existing or repeated Case Numbers are allowed and assigned unique serial numbers.
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 mt-2 block">
                  Permits duplicate case entries
                </span>
              </label>

              {/* Option 2: Append New Only (Skip Duplicates) */}
              <label
                className={`p-3.5 rounded-lg border cursor-pointer flex flex-col justify-between transition-all ${
                  importMode === 'append' && !allowDuplicates
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-950 dark:text-blue-100 ring-1 ring-blue-600'
                    : 'border-slate-200 dark:border-slate-750 hover:border-slate-300 dark:hover:border-slate-650'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <input
                    type="radio"
                    name="importMode"
                    value="append"
                    checked={importMode === 'append' && !allowDuplicates}
                    onChange={() => {
                      setImportMode('append');
                      setAllowDuplicates(false);
                    }}
                    className="mt-0.5 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-xs font-bold block">Append New (Skip Duplicates)</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                      Inserts only new cases. If a Case No already exists in the database or CSV, it is safely skipped.
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 mt-2 block">
                  Deduplication enabled
                </span>
              </label>

              {/* Option 3: Merge & Upsert */}
              <label
                className={`p-3.5 rounded-lg border cursor-pointer flex flex-col justify-between transition-all ${
                  importMode === 'update_existing'
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-950 dark:text-blue-100 ring-1 ring-blue-600'
                    : 'border-slate-200 dark:border-slate-750 hover:border-slate-300 dark:hover:border-slate-650'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <input
                    type="radio"
                    name="importMode"
                    value="update_existing"
                    checked={importMode === 'update_existing'}
                    onChange={() => setImportMode('update_existing')}
                    className="mt-0.5 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-xs font-bold block">Merge & Update Existing</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                      Updates dates and remarks for existing Case Numbers, and inserts any new Case Numbers.
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 mt-2 block">
                  Best for bulk date stage updates
                </span>
              </label>

              {/* Option 4: Clean & Replace */}
              <label
                className={`p-3.5 rounded-lg border cursor-pointer flex flex-col justify-between transition-all ${
                  importMode === 'clean_and_import'
                    ? 'border-red-600 bg-red-50/50 dark:bg-red-950/30 text-red-950 dark:text-red-100 ring-1 ring-red-600'
                    : 'border-slate-200 dark:border-slate-750 hover:border-slate-300 dark:hover:border-slate-650'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <input
                    type="radio"
                    name="importMode"
                    value="clean_and_import"
                    checked={importMode === 'clean_and_import'}
                    onChange={() => setImportMode('clean_and_import')}
                    className="mt-0.5 text-red-600 focus:ring-red-500"
                  />
                  <div>
                    <span className="text-xs font-bold block text-red-600 dark:text-red-400">
                      Clean & Replace All Data
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                      Empties current database and loads fresh CSV records starting at Serial #1.
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-red-600 dark:text-red-400 mt-2 block">
                  Safety backup created automatically
                </span>
              </label>
            </div>

            {/* Checkbox Options */}
            <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
              <label className="flex items-center gap-2 text-slate-800 dark:text-slate-200 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={allowDuplicates}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setAllowDuplicates(checked);
                    if (checked && importMode === 'append') {
                      setImportMode('append_allow_duplicates');
                    } else if (!checked && importMode === 'append_allow_duplicates') {
                      setImportMode('append');
                    }
                  }}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="flex items-center gap-1.5">
                  <Copy className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Allow duplicate data (import repeated or existing Case Numbers as separate records)</span>
                </span>
              </label>

              <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createSafetyBackup}
                  onChange={(e) => setCreateSafetyBackup(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium">Create automatic safety backup before importing</span>
              </label>

              <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={keepSerialNo}
                  onChange={(e) => setKeepSerialNo(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium">Keep CSV Serial Numbers if valid and non-colliding</span>
              </label>
            </div>
          </div>

          {/* Live Data Preview Table */}
          <div className="bg-white dark:bg-slate-850 rounded-lg border border-slate-200 dark:border-slate-750 shadow-2xs overflow-hidden">
            {/* Table Filter Tabs & Page Controls */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-750 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
                <button
                  onClick={() => {
                    setFilterTab('all');
                    setPreviewPage(1);
                  }}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    filterTab === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  All ({stats.total})
                </button>

                <button
                  onClick={() => {
                    setFilterTab('valid');
                    setPreviewPage(1);
                  }}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    filterTab === 'valid'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Clean Valid ({stats.valid - stats.warnings >= 0 ? stats.valid - stats.warnings : 0})
                </button>

                <button
                  onClick={() => {
                    setFilterTab('duplicates');
                    setPreviewPage(1);
                  }}
                  className={`px-2.5 py-1 rounded font-medium transition-colors flex items-center gap-1 ${
                    filterTab === 'duplicates'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Copy className="w-3 h-3" />
                  <span>Duplicates ({stats.duplicates})</span>
                </button>

                <button
                  onClick={() => {
                    setFilterTab('warnings');
                    setPreviewPage(1);
                  }}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    filterTab === 'warnings'
                      ? 'bg-amber-600 text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Warnings ({stats.warnings})
                </button>

                {stats.errors > 0 && (
                  <button
                    onClick={() => {
                      setFilterTab('errors');
                      setPreviewPage(1);
                    }}
                    className={`px-2.5 py-1 rounded font-medium transition-colors ${
                      filterTab === 'errors'
                        ? 'bg-red-600 text-white'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    Errors ({stats.errors})
                  </button>
                )}
              </div>

              {/* Pagination */}
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>
                  Page {previewPage} of {totalPreviewPages} ({filteredPreviewRows.length} rows)
                </span>
                <button
                  onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}
                  disabled={previewPage <= 1}
                  className="px-2 py-0.5 border border-slate-300 dark:border-slate-700 rounded disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPreviewPage((p) => Math.min(totalPreviewPages, p + 1))}
                  disabled={previewPage >= totalPreviewPages}
                  className="px-2 py-0.5 border border-slate-300 dark:border-slate-700 rounded disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-700">
                    <th className="py-2.5 px-3 w-12 text-center">Row</th>
                    <th className="py-2.5 px-3 w-24">Status</th>
                    <th className="py-2.5 px-3 w-20">Serial No</th>
                    <th className="py-2.5 px-3 font-bold">Case No</th>
                    <th className="py-2.5 px-3">Judgement Date</th>
                    <th className="py-2.5 px-3">Draft Date</th>
                    <th className="py-2.5 px-3">Final Date</th>
                    <th className="py-2.5 px-3">Section Date</th>
                    <th className="py-2.5 px-3">Remarks</th>
                    <th className="py-2.5 px-3">Notes & Diagnostics</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {paginatedPreviewRows.map((r) => (
                    <tr
                      key={r.rowNumber}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                        !r.isValid
                          ? 'bg-red-50/50 dark:bg-red-950/20'
                          : r.warnings.length > 0
                          ? 'bg-amber-50/30 dark:bg-amber-950/15'
                          : ''
                      }`}
                    >
                      <td className="py-2 px-3 text-center font-mono text-slate-400">
                        {r.rowNumber}
                      </td>

                      <td className="py-2 px-3">
                        {!r.isValid ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-100 dark:bg-red-900/50 px-1.5 py-0.5 rounded">
                            <X className="w-3 h-3" /> Error
                          </span>
                        ) : r.isDuplicate && allowDuplicates ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-100 dark:bg-blue-900/50 px-1.5 py-0.5 rounded">
                            <Copy className="w-3 h-3" /> Duplicate
                          </span>
                        ) : r.warnings.length > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 dark:bg-amber-900/50 px-1.5 py-0.5 rounded">
                            <AlertTriangle className="w-3 h-3" /> Warning
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/50 px-1.5 py-0.5 rounded">
                            <Check className="w-3 h-3" /> Valid
                          </span>
                        )}
                      </td>

                      <td className="py-2 px-3 font-mono text-slate-500">
                        {r.serialNo || '—'}
                      </td>

                      <td className="py-2 px-3 font-bold font-mono text-blue-600 dark:text-blue-400">
                        {r.caseNo || <span className="text-red-500 italic">Missing</span>}
                      </td>

                      <td className="py-2 px-3 font-mono text-slate-700 dark:text-slate-300">
                        {formatToDisplayDate(r.judgementDate) || '—'}
                      </td>

                      <td className="py-2 px-3 font-mono text-slate-700 dark:text-slate-300">
                        {formatToDisplayDate(r.draftDate) || '—'}
                      </td>

                      <td className="py-2 px-3 font-mono text-slate-700 dark:text-slate-300">
                        {formatToDisplayDate(r.finalDate) || '—'}
                      </td>

                      <td className="py-2 px-3 font-mono text-slate-700 dark:text-slate-300">
                        {formatToDisplayDate(r.sendToSectionDate) || '—'}
                      </td>

                      <td className="py-2 px-3 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                        {r.remarks || '—'}
                      </td>

                      <td className="py-2 px-3 text-[11px]">
                        {r.isDuplicate && (
                          <div className="mb-1">
                            <span
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                allowDuplicates
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                              }`}
                            >
                              <Copy className="w-3 h-3" />
                              {allowDuplicates
                                ? 'Duplicate Case (Allowed: will import as new record)'
                                : 'Duplicate Case (Will be skipped)'}
                            </span>
                          </div>
                        )}
                        {r.errors.length > 0 && (
                          <span className="text-red-600 dark:text-red-400 font-medium block">
                            {r.errors.join('; ')}
                          </span>
                        )}
                        {r.warnings.length > 0 && (
                          <span className="text-amber-600 dark:text-amber-400 block">
                            {r.warnings.join('; ')}
                          </span>
                        )}
                        {r.errors.length === 0 && r.warnings.length === 0 && !r.isDuplicate && (
                          <span className="text-slate-400">Ready to import</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Actions */}
            <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-750 flex items-center justify-between">
              <button
                onClick={() => setCurrentStep('mapping')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Adjust Mapping</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  Cancel
                </button>

                <button
                  onClick={handleExecuteImport}
                  disabled={isProcessing || stats.valid === 0}
                  className={`flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-md shadow-xs transition-colors ${
                    isProcessing || stats.valid === 0
                      ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                      <span>Importing records...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>
                        Confirm & Import {stats.valid} Record{stats.valid === 1 ? '' : 's'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: IMPORT COMPLETE SUMMARY */}
      {currentStep === 'complete' && importSummary && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-850 p-8 rounded-xl border border-slate-200 dark:border-slate-750 shadow-xs text-center max-w-2xl mx-auto space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Import Process Completed
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Data records from <strong className="text-slate-700 dark:text-slate-300">{fileName}</strong> were processed and saved to the local SQLite database.
              </p>
            </div>

            {/* Results Grid */}
            <div className={`grid gap-3 py-4 border-y border-slate-200 dark:border-slate-750 ${
              (importSummary.duplicatesImportedCount || 0) > 0 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'
            }`}>
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                <span className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300">
                  New Records Added
                </span>
                <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                  {importSummary.importedCount}
                </p>
              </div>

              {(importSummary.duplicatesImportedCount || 0) > 0 && (
                <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/30">
                  <span className="text-[11px] font-medium text-indigo-800 dark:text-indigo-300 flex items-center justify-center gap-1">
                    <Copy className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                    <span>Duplicates Allowed</span>
                  </span>
                  <p className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1">
                    {importSummary.duplicatesImportedCount}
                  </p>
                </div>
              )}

              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <span className="text-[11px] font-medium text-blue-800 dark:text-blue-300">
                  Records Updated
                </span>
                <p className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-1">
                  {importSummary.updatedCount}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                  Skipped / Invalid
                </span>
                <p className="text-2xl font-bold font-mono text-slate-600 dark:text-slate-300 mt-1">
                  {importSummary.skippedCount}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => onNavigate('all-records')}
                className="w-full sm:w-auto px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <TableProperties className="w-4 h-4" />
                <span>View in All Records</span>
              </button>

              <button
                onClick={() => onNavigate('dashboard')}
                className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 rounded-md transition-colors"
              >
                Go to Dashboard
              </button>

              <button
                onClick={handleReset}
                className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-md transition-colors flex items-center justify-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import Another File</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
