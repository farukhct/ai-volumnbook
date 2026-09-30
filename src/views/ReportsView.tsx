/**
 * VolumnBook — Official Reporting System
 * Generates 11 specialized reports directly from live SQLite database records.
 * Supports on-screen preview, A4 printing, PDF, DOCX, and XLS export.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Printer,
  FileSpreadsheet,
  Calendar,
  Layers,
  CheckCircle,
  Clock,
  Filter,
} from 'lucide-react';
import { VolumeRecord, ReportType, NavigationModule } from '../types';
import { db } from '../lib/database';
import { formatToDisplayDate, formatFullDateTime, getTodayDbDate } from '../lib/dateUtils';
import { DatePickerInput } from '../components/DatePickerInput';
import { useToast } from '../components/Toast';
import { exportToPdf, exportToDocx, exportToExcel } from '../lib/exportUtils';

interface ReportsViewProps {
  onNavigate: (module: NavigationModule) => void;
  onPrintReport?: (records: VolumeRecord[], reportTitle: string, filterInfo: string) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ onNavigate, onPrintReport }) => {
  const { showToast } = useToast();
  const [allRecords, setAllRecords] = useState<VolumeRecord[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportType>('all-records');

  // Filter parameters
  const [reportDate, setReportDate] = useState<string | null>(getTodayDbDate());
  const [dateFrom, setDateFrom] = useState<string | null>(null);
  const [dateTo, setDateTo] = useState<string | null>(null);
  const [caseNoFilter, setCaseNoFilter] = useState<string>('');

  useEffect(() => {
    const fetchAll = async () => {
      const records = await db.getRecords();
      setAllRecords(records);
    };
    fetchAll();
  }, []);

  const reportConfigs: { id: ReportType; label: string; description: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'all-records', label: '1. All Records Report', description: 'Complete volume inventory of all cases', icon: Layers },
    { id: 'daily-report', label: '2. Daily Activity Report', description: 'Records created or modified on a selected date', icon: Calendar },
    { id: 'date-range', label: '3. Date Range Report', description: 'Records within specified judgement date window', icon: Calendar },
    { id: 'case-no-search', label: '4. Case No Search Report', description: 'Filtered report by case reference number', icon: FileText },
    { id: 'judgement-date', label: '5. Judgement Date Report', description: 'All cases with completed judgement dates', icon: CheckCircle },
    { id: 'draft-date', label: '6. Draft Date Report', description: 'All cases with finalized draft orders', icon: Clock },
    { id: 'final-date', label: '7. Final Date Report', description: 'All cases with completed final revisions', icon: CheckCircle },
    { id: 'send-to-section', label: '8. Send to Section Report', description: 'All cases officially transmitted to section', icon: CheckCircle },
    { id: 'pending-records', label: '9. Pending Records Report', description: 'Cases awaiting draft, final, or dispatch', icon: Clock },
    { id: 'completed-records', label: '10. Completed Records Report', description: 'Cases with all steps completed', icon: CheckCircle },
    { id: 'custom-filtered', label: '11. Custom Filtered Report', description: 'Custom combination of criteria', icon: Filter },
  ];

  // Compute filtered records for active report type
  const { filteredRecords, reportTitle, filterDescription } = useMemo(() => {
    let result = [...allRecords];
    let title = 'All Volume Records';
    let filterDesc = 'All Records in Database';

    switch (selectedReport) {
      case 'all-records':
        title = 'Complete Volume Book Register';
        filterDesc = 'All Records';
        break;

      case 'daily-report':
        const targetDate = reportDate || getTodayDbDate();
        title = `Daily Activity Report (${formatToDisplayDate(targetDate)})`;
        filterDesc = `Date: ${formatToDisplayDate(targetDate)}`;
        result = result.filter(
          (r) =>
            r.CreatedAt.startsWith(targetDate) ||
            r.JudgementDate === targetDate ||
            r.DraftDate === targetDate ||
            r.FinalDate === targetDate ||
            r.SendToSectionDate === targetDate
        );
        break;

      case 'date-range':
        title = 'Judgement Date Range Report';
        filterDesc = `From ${formatToDisplayDate(dateFrom) || 'Beginning'} To ${formatToDisplayDate(dateTo) || 'Today'}`;
        if (dateFrom) result = result.filter((r) => r.JudgementDate && r.JudgementDate >= dateFrom);
        if (dateTo) result = result.filter((r) => r.JudgementDate && r.JudgementDate <= dateTo);
        break;

      case 'case-no-search':
        title = `Case Specific Report (${caseNoFilter || 'All'})`;
        filterDesc = `Case No keyword: "${caseNoFilter || ''}"`;
        if (caseNoFilter.trim()) {
          const t = caseNoFilter.trim().toLowerCase();
          result = result.filter((r) => r.CaseNo.toLowerCase().includes(t));
        }
        break;

      case 'judgement-date':
        title = 'Judgement Delivered Cases Report';
        filterDesc = 'Cases with recorded Judgement Date';
        result = result.filter((r) => !!r.JudgementDate);
        break;

      case 'draft-date':
        title = 'Draft Prepared Cases Report';
        filterDesc = 'Cases with recorded Draft Date';
        result = result.filter((r) => !!r.DraftDate);
        break;

      case 'final-date':
        title = 'Final Order Approved Cases Report';
        filterDesc = 'Cases with recorded Final Date';
        result = result.filter((r) => !!r.FinalDate);
        break;

      case 'send-to-section':
        title = 'Dispatched to Section Report';
        filterDesc = 'Cases sent to administrative section';
        result = result.filter((r) => !!r.SendToSectionDate);
        break;

      case 'pending-records':
        title = 'Pending / In-Progress Volume Report';
        filterDesc = 'Cases awaiting draft, final, or dispatch';
        result = result.filter((r) => !r.SendToSectionDate);
        break;

      case 'completed-records':
        title = 'Fully Completed Cases Report';
        filterDesc = 'Cases with all workflow dates fulfilled';
        result = result.filter(
          (r) => !!r.JudgementDate && !!r.DraftDate && !!r.FinalDate && !!r.SendToSectionDate
        );
        break;

      case 'custom-filtered':
        title = 'Custom Filtered Volume Report';
        filterDesc = 'Custom multi-parameter filter';
        if (caseNoFilter.trim()) {
          result = result.filter((r) => r.CaseNo.toLowerCase().includes(caseNoFilter.toLowerCase().trim()));
        }
        if (dateFrom) result = result.filter((r) => r.JudgementDate && r.JudgementDate >= dateFrom);
        if (dateTo) result = result.filter((r) => r.JudgementDate && r.JudgementDate <= dateTo);
        break;
    }

    return { filteredRecords: result, reportTitle: title, filterDescription: filterDesc };
  }, [allRecords, selectedReport, reportDate, dateFrom, dateTo, caseNoFilter]);

  // Actions
  const handlePrint = () => {
    if (onPrintReport) {
      onPrintReport(filteredRecords, reportTitle, filterDescription);
    } else {
      exportToPdf(filteredRecords, { title: reportTitle, filterDescription });
    }
  };

  const handlePdf = () => {
    exportToPdf(filteredRecords, { title: reportTitle, filterDescription });
    showToast('PDF Report generated successfully.', 'success');
  };

  const handleDocx = () => {
    exportToDocx(filteredRecords, { title: reportTitle, filterDescription });
    showToast('Word (.docx) Report generated successfully.', 'success');
  };

  const handleExcel = (format: 'xls' | 'xlsx' = 'xls') => {
    exportToExcel(filteredRecords, format, { title: reportTitle, filterDescription });
    showToast(`Excel (.${format}) Report generated successfully.`, 'success');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Official Reporting Module
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Generate formal court volume and case reports directly from SQLite database records.
          </p>
        </div>

        {/* Global Export & Print Toolbar */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>

          <button
            onClick={handlePdf}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 rounded"
          >
            PDF
          </button>

          <button
            onClick={handleDocx}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 rounded"
          >
            DOCX
          </button>

          <button
            onClick={() => handleExcel('xls')}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 rounded"
          >
            XLS
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Side: 11 Report Types Picker */}
        <div className="lg:col-span-1 space-y-1.5 bg-white dark:bg-slate-800/80 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs h-fit">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-2 py-1 mb-1">
            Report Types
          </h2>

          {reportConfigs.map((cfg) => {
            const isSelected = selectedReport === cfg.id;
            return (
              <button
                key={cfg.id}
                onClick={() => setSelectedReport(cfg.id)}
                className={`w-full text-left p-2 rounded-md transition-colors text-xs flex flex-col gap-0.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                }`}
              >
                <span>{cfg.label}</span>
                <span className={`text-[10px] ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                  {cfg.description}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Side: Report Filters & Live Document Preview */}
        <div className="lg:col-span-3 space-y-4">
          {/* Dynamic Filters depending on selected report */}
          {(selectedReport === 'daily-report' ||
            selectedReport === 'date-range' ||
            selectedReport === 'case-no-search' ||
            selectedReport === 'custom-filtered') && (
            <div className="bg-white dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block mb-2">
                Report Filter Parameters:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {selectedReport === 'daily-report' && (
                  <DatePickerInput
                    label="Select Report Date"
                    value={reportDate}
                    onChange={setReportDate}
                  />
                )}

                {(selectedReport === 'date-range' || selectedReport === 'custom-filtered') && (
                  <>
                    <DatePickerInput
                      label="Judgement Date From"
                      value={dateFrom}
                      onChange={setDateFrom}
                    />
                    <DatePickerInput
                      label="Judgement Date To"
                      value={dateTo}
                      onChange={setDateTo}
                    />
                  </>
                )}

                {(selectedReport === 'case-no-search' || selectedReport === 'custom-filtered') && (
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Case Number Keyword
                    </label>
                    <input
                      type="text"
                      value={caseNoFilter}
                      onChange={(e) => setCaseNoFilter(e.target.value)}
                      placeholder="e.g. 2026 or WP"
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-800 dark:text-slate-100"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Formal Official Report Document Preview Box */}
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-700 shadow-md p-6 font-sans">
            {/* Report Header as required by prompt section 39 */}
            <div className="border-b-2 border-blue-900 dark:border-blue-500 pb-3 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black tracking-wider text-blue-900 dark:text-blue-400">
                    VOLUMNBOOK
                  </h2>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Case & Judgement Volume Management
                  </p>
                </div>
                <div className="text-right text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  <div>Generated: {formatFullDateTime(new Date())}</div>
                  <div>Report Status: Official</div>
                </div>
              </div>

              <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                <div>
                  <strong className="text-slate-800 dark:text-slate-200">Report: </strong>
                  <span className="text-blue-700 dark:text-blue-300 font-semibold">{reportTitle}</span>
                </div>
                <div className="text-slate-500 dark:text-slate-400">
                  <span>Applied Filter: {filterDescription}</span>
                  <span className="mx-2">·</span>
                  <strong className="text-slate-800 dark:text-slate-200 font-mono">
                    Total Records: {filteredRecords.length}
                  </strong>
                </div>
              </div>
            </div>

            {/* Report Table */}
            {filteredRecords.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No volume records matched this report filter.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
                <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-800">
                  <thead className="bg-blue-950 text-white font-semibold">
                    <tr>
                      <th className="py-2 px-2.5 w-12 text-center border-r border-blue-900">Sl</th>
                      <th className="py-2 px-3 border-r border-blue-900 min-w-[120px]">Case No</th>
                      <th className="py-2 px-2.5 text-center border-r border-blue-900">Judgement Date</th>
                      <th className="py-2 px-2.5 text-center border-r border-blue-900">Draft Date</th>
                      <th className="py-2 px-2.5 text-center border-r border-blue-900">Final Date</th>
                      <th className="py-2 px-2.5 text-center border-r border-blue-900">Send To Section</th>
                      <th className="py-2 px-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                    {filteredRecords.map((r) => (
                      <tr key={r.Id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-1.5 px-2.5 text-center font-mono font-bold text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">
                          {r.SerialNo}
                        </td>
                        <td className="py-1.5 px-3 font-semibold text-blue-800 dark:text-blue-300 border-r border-slate-200 dark:border-slate-800">
                          {r.CaseNo}
                        </td>
                        <td className="py-1.5 px-2.5 text-center font-mono border-r border-slate-200 dark:border-slate-800">
                          {formatToDisplayDate(r.JudgementDate) || '—'}
                        </td>
                        <td className="py-1.5 px-2.5 text-center font-mono border-r border-slate-200 dark:border-slate-800">
                          {formatToDisplayDate(r.DraftDate) || '—'}
                        </td>
                        <td className="py-1.5 px-2.5 text-center font-mono border-r border-slate-200 dark:border-slate-800">
                          {formatToDisplayDate(r.FinalDate) || '—'}
                        </td>
                        <td className="py-1.5 px-2.5 text-center font-mono border-r border-slate-200 dark:border-slate-800">
                          {formatToDisplayDate(r.SendToSectionDate) || '—'}
                        </td>
                        <td className="py-1.5 px-3 text-slate-600 dark:text-slate-400 truncate max-w-xs">
                          {r.Remarks || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Report Footer */}
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>Generated by VolumnBook — Confidential Office Record</span>
              <span>Document Page 1 of 1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
