/**
 * VolumnBook — Dedicated Export Module
 * Export records into official PDF, DOCX (Word), and XLS/XLSX (Excel) formats.
 */

import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Download,
  CheckCircle,
  Layers,
  ArrowRight,
  Upload,
} from 'lucide-react';
import { VolumeRecord, NavigationModule } from '../types';
import { db } from '../lib/database';
import { exportToPdf, exportToDocx, exportToExcel } from '../lib/exportUtils';
import { exportRecordsToCsv } from '../lib/csvUtils';
import { useToast } from '../components/Toast';

interface ExportViewProps {
  onNavigate: (module: NavigationModule) => void;
}

export const ExportView: React.FC<ExportViewProps> = ({ onNavigate }) => {
  const { showToast } = useToast();
  const [allRecords, setAllRecords] = useState<VolumeRecord[]>([]);
  const [exportScope, setExportScope] = useState<'all' | 'with-judgement' | 'pending-section' | 'completed'>('all');
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'docx' | 'xls' | 'xlsx' | 'csv'>('csv');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      const records = await db.getRecords();
      setAllRecords(records);
    };
    load();
  }, []);

  const targetRecords = React.useMemo(() => {
    switch (exportScope) {
      case 'all':
        return allRecords;
      case 'with-judgement':
        return allRecords.filter((r) => !!r.JudgementDate);
      case 'pending-section':
        return allRecords.filter((r) => !r.SendToSectionDate);
      case 'completed':
        return allRecords.filter((r) => !!r.SendToSectionDate);
      default:
        return allRecords;
    }
  }, [allRecords, exportScope]);

  const handleExecuteExport = async () => {
    if (targetRecords.length === 0) {
      showToast('No records match the selected scope to export.', 'info');
      return;
    }

    setIsExporting(true);
    try {
      const scopeTitles = {
        all: 'All Volume Records',
        'with-judgement': 'Judgement Delivered Volume Records',
        'pending-section': 'Pending Section Volume Records',
        completed: 'Completed Transmitted Volume Records',
      };
      const title = scopeTitles[exportScope];

      if (selectedFormat === 'pdf') {
        await exportToPdf(targetRecords, { title });
        showToast('PDF document exported successfully.', 'success');
      } else if (selectedFormat === 'docx') {
        await exportToDocx(targetRecords, { title });
        showToast('Word document (.docx) exported successfully.', 'success');
      } else if (selectedFormat === 'xls') {
        await exportToExcel(targetRecords, 'xls', { title });
        showToast('Excel workbook (.xls) exported successfully.', 'success');
      } else if (selectedFormat === 'xlsx') {
        await exportToExcel(targetRecords, 'xlsx', { title });
        showToast('Excel workbook (.xlsx) exported successfully.', 'success');
      } else if (selectedFormat === 'csv') {
        exportRecordsToCsv(targetRecords);
        showToast('CSV file (.csv) exported successfully.', 'success');
      }
    } catch (err: any) {
      showToast('Export failed. Please check system resources.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          Export Volume Records
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Generate offline documents for distribution, legal archiving, and external spreadsheet analysis.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800/90 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs p-6 space-y-6">
        {/* Step 1: Select Export Scope */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-2">
            1. Select Record Scope:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { id: 'all', title: 'All Records', desc: `Entire database (${allRecords.length} records)` },
              {
                id: 'with-judgement',
                title: 'Judgement Delivered',
                desc: `${allRecords.filter((r) => !!r.JudgementDate).length} records with Judgement Date`,
              },
              {
                id: 'pending-section',
                title: 'Awaiting Section Transmission',
                desc: `${allRecords.filter((r) => !r.SendToSectionDate).length} pending dispatch`,
              },
              {
                id: 'completed',
                title: 'Completed Cases',
                desc: `${allRecords.filter((r) => !!r.SendToSectionDate).length} transmitted to section`,
              },
            ].map((scope) => (
              <div
                key={scope.id}
                onClick={() => setExportScope(scope.id as any)}
                className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                  exportScope === scope.id
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-400 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{scope.title}</span>
                  {exportScope === scope.id && <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{scope.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Step 2: Select Document Format */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-2">
            2. Choose File Format:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              {
                id: 'csv',
                title: 'CSV File',
                ext: '.csv',
                desc: 'Universal text format for spreadsheets and round-trip re-import',
              },
              {
                id: 'pdf',
                title: 'PDF Document',
                ext: '.pdf',
                desc: 'Fixed layout, A4 table, print-ready with headers and page numbers',
              },
              {
                id: 'docx',
                title: 'Microsoft Word',
                ext: '.docx',
                desc: 'Editable Word table document formatted for official office archival',
              },
              {
                id: 'xls',
                title: 'Excel (Standard)',
                ext: '.xls',
                desc: 'Standard Excel format compatible with all versions of Microsoft Office',
              },
              {
                id: 'xlsx',
                title: 'Excel (Modern)',
                ext: '.xlsx',
                desc: 'Modern OpenXML spreadsheet format with column auto-widths',
              },
            ].map((fmt) => (
              <div
                key={fmt.id}
                onClick={() => setSelectedFormat(fmt.id as any)}
                className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                  selectedFormat === fmt.id
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-400 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{fmt.title}</span>
                  <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                    {fmt.ext}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{fmt.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Export Execution Box */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Exporting <strong>{targetRecords.length} records</strong> to <code className="text-blue-600 font-bold">.{selectedFormat}</code>
          </div>

          <button
            onClick={handleExecuteExport}
            disabled={isExporting || targetRecords.length === 0}
            className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 rounded-md shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Generating Document...' : `Download ${selectedFormat.toUpperCase()} File`}</span>
          </button>
        </div>
      </div>

      {/* Switch to Import Facility Banner */}
      <div className="bg-slate-100 dark:bg-slate-850 p-4 rounded-lg border border-slate-200 dark:border-slate-750 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
            <Upload className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Need to bring external CSV data into VolumnBook?
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Use our step-by-step CSV Data Import Facility with column auto-mapping and conflict protection.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('import')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-md shadow-2xs transition-colors"
        >
          <span>Open Import Facility</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
