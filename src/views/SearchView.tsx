/**
 * VolumnBook — On-Demand Search Facility
 * Global search & advanced multi-field date range filters with live result counts.
 */

import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  RotateCcw,
  Printer,
  FileSpreadsheet,
  FileText,
  Eye,
  Edit2,
  PlusCircle,
  TableProperties,
} from 'lucide-react';
import { VolumeRecord, FilterCriteria, NavigationModule } from '../types';
import { db } from '../lib/database';
import { formatToDisplayDate } from '../lib/dateUtils';
import { DatePickerInput } from '../components/DatePickerInput';
import { EditRecordModal } from '../components/EditRecordModal';
import { useToast } from '../components/Toast';
import { exportToPdf, exportToDocx, exportToExcel } from '../lib/exportUtils';

interface SearchViewProps {
  onNavigate: (module: NavigationModule) => void;
  onPrintRecords?: (records: VolumeRecord[], title: string) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({ onNavigate, onPrintRecords }) => {
  const { showToast } = useToast();
  const [totalDbCount, setTotalDbCount] = useState<number>(0);
  const [results, setResults] = useState<VolumeRecord[]>([]);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<VolumeRecord | null>(null);

  // Search filter fields
  const [globalQuery, setGlobalQuery] = useState<string>('');
  const [caseNoQuery, setCaseNoQuery] = useState<string>('');
  const [jFrom, setJFrom] = useState<string | null>(null);
  const [jTo, setJTo] = useState<string | null>(null);
  const [dFrom, setDFrom] = useState<string | null>(null);
  const [dTo, setDTo] = useState<string | null>(null);
  const [fFrom, setFFrom] = useState<string | null>(null);
  const [fTo, setFTo] = useState<string | null>(null);
  const [sFrom, setSFrom] = useState<string | null>(null);
  const [sTo, setSTo] = useState<string | null>(null);
  const [remarksQuery, setRemarksQuery] = useState<string>('');

  const [isAdvancedExpanded, setIsAdvancedExpanded] = useState<boolean>(false);

  useEffect(() => {
    const init = async () => {
      const all = await db.getRecords();
      setTotalDbCount(all.length);
      setResults(all);
    };
    init();
  }, []);

  const handleExecuteSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);

    try {
      const criteria: FilterCriteria = {
        globalSearch: globalQuery.trim() || undefined,
        caseNo: caseNoQuery.trim() || undefined,
        judgementDateFrom: jFrom || undefined,
        judgementDateTo: jTo || undefined,
        draftDateFrom: dFrom || undefined,
        draftDateTo: dTo || undefined,
        finalDateFrom: fFrom || undefined,
        finalDateTo: fTo || undefined,
        sendToSectionDateFrom: sFrom || undefined,
        sendToSectionDateTo: sTo || undefined,
        remarksKeyword: remarksQuery.trim() || undefined,
      };

      const matched = await db.getRecords(criteria);
      setResults(matched);
      setHasSearched(true);
    } catch (err: any) {
      showToast('Search execution failed.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    setGlobalQuery('');
    setCaseNoQuery('');
    setJFrom(null);
    setJTo(null);
    setDFrom(null);
    setDTo(null);
    setFFrom(null);
    setFTo(null);
    setSFrom(null);
    setSTo(null);
    setRemarksQuery('');
    setHasSearched(false);

    const all = await db.getRecords();
    setResults(all);
    setTotalDbCount(all.length);
  };

  const handlePrintFiltered = () => {
    if (results.length === 0) {
      showToast('No search results to print.', 'info');
      return;
    }
    if (onPrintRecords) {
      onPrintRecords(results, `Search Results (${results.length} records)`);
    } else {
      exportToPdf(results, { title: 'Filtered Volume Search Results' });
    }
  };

  const handleSaveEdit = async (id: number, updates: Partial<VolumeRecord>) => {
    await db.updateRecord(id, updates);
    // Refresh search results
    await handleExecuteSearch();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            On-Demand Search Facility
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Query volume records by serial number, case identifier, date ranges, and remarks.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {results.length > 0 && (
            <>
              <button
                onClick={handlePrintFiltered}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 rounded shadow-xs"
              >
                <Printer className="w-3.5 h-3.5 text-indigo-500" />
                <span>Print Results</span>
              </button>

              <button
                onClick={() => exportToPdf(results, { title: 'Search Results' })}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 rounded shadow-xs"
              >
                <FileText className="w-3.5 h-3.5 text-red-500" />
                <span>Export PDF</span>
              </button>

              <button
                onClick={() => exportToExcel(results, 'xls', { title: 'Search Results' })}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 rounded shadow-xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                <span>Export XLS</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Search Input Box Card */}
      <form onSubmit={handleExecuteSearch} className="bg-white dark:bg-slate-800/90 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs p-4 space-y-4">
        {/* Global Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={globalQuery}
              onChange={(e) => setGlobalQuery(e.target.value)}
              placeholder="Search across all fields: Serial No, Case No, Dates (dd-MM-yyyy), Remarks..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-500 font-medium"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setIsAdvancedExpanded(!isAdvancedExpanded)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md border transition-colors ${
                isAdvancedExpanded
                  ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-400 text-blue-700 dark:text-blue-300'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{isAdvancedExpanded ? 'Hide Filters' : 'Advanced Filters'}</span>
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs transition-colors flex-1 sm:flex-initial justify-center"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Searching...' : 'Search'}</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              title="Reset All Filters"
              className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Collapsible Advanced Multi-Field Filters */}
        {isAdvancedExpanded && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in">
            {/* Case No */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Case No Keyword
              </label>
              <input
                type="text"
                value={caseNoQuery}
                onChange={(e) => setCaseNoQuery(e.target.value)}
                placeholder="e.g. WP/2026"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Judgement Date Range */}
            <div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Judgement Date Range
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <DatePickerInput placeholder="From" value={jFrom} onChange={setJFrom} />
                <DatePickerInput placeholder="To" value={jTo} onChange={setJTo} />
              </div>
            </div>

            {/* Draft Date Range */}
            <div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Draft Date Range
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <DatePickerInput placeholder="From" value={dFrom} onChange={setDFrom} />
                <DatePickerInput placeholder="To" value={dTo} onChange={setDTo} />
              </div>
            </div>

            {/* Final Date Range */}
            <div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Final Date Range
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <DatePickerInput placeholder="From" value={fFrom} onChange={setFFrom} />
                <DatePickerInput placeholder="To" value={fTo} onChange={setFTo} />
              </div>
            </div>

            {/* Send to Section Date Range */}
            <div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Send to Section Range
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <DatePickerInput placeholder="From" value={sFrom} onChange={setSFrom} />
                <DatePickerInput placeholder="To" value={sTo} onChange={setSTo} />
              </div>
            </div>

            {/* Remarks Keyword */}
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Remarks Contains Keyword
              </label>
              <input
                type="text"
                value={remarksQuery}
                onChange={(e) => setRemarksQuery(e.target.value)}
                placeholder="Search words inside remarks..."
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>
        )}
      </form>

      {/* Result Count Banner */}
      <div className="flex items-center justify-between px-2 text-xs">
        <div className="font-semibold text-slate-700 dark:text-slate-200">
          Showing <span className="text-blue-600 dark:text-blue-400 font-mono text-sm font-bold">{results.length}</span> of{' '}
          <span className="font-mono">{totalDbCount}</span> records
        </div>

        {hasSearched && (
          <button
            onClick={handleReset}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            Clear Filters & Show All
          </button>
        )}
      </div>

      {/* Results Table */}
      <div className="bg-white dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        {results.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <Search className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No matching records</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Try adjusting your search criteria or resetting filters.
            </p>
            <button
              onClick={handleReset}
              className="mt-3 px-3 py-1.5 text-xs font-medium text-blue-600 hover:underline"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[550px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-900 sticky top-0 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold select-none">
                <tr>
                  <th className="py-2.5 px-3 w-16 text-center">Serial No</th>
                  <th className="py-2.5 px-3 min-w-[140px]">Case No</th>
                  <th className="py-2.5 px-3 text-center">Judgement Date</th>
                  <th className="py-2.5 px-3 text-center">Draft Date</th>
                  <th className="py-2.5 px-3 text-center">Final Date</th>
                  <th className="py-2.5 px-3 text-center">Send to Section</th>
                  <th className="py-2.5 px-3 min-w-[160px]">Remarks</th>
                  <th className="py-2.5 px-3 text-center w-24">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-750 text-slate-700 dark:text-slate-200">
                {results.map((r) => (
                  <tr key={r.Id} className="hover:bg-slate-50/80 dark:hover:bg-slate-750/50 transition-colors">
                    <td className="py-2 px-3 text-center font-mono font-bold text-slate-600 dark:text-slate-300">
                      {r.SerialNo}
                    </td>
                    <td className="py-2 px-3 font-semibold text-blue-600 dark:text-blue-400">
                      {r.CaseNo}
                    </td>
                    <td className="py-2 px-3 text-center font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {formatToDisplayDate(r.JudgementDate) || '—'}
                    </td>
                    <td className="py-2 px-3 text-center font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {formatToDisplayDate(r.DraftDate) || '—'}
                    </td>
                    <td className="py-2 px-3 text-center font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {formatToDisplayDate(r.FinalDate) || '—'}
                    </td>
                    <td className="py-2 px-3 text-center font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {formatToDisplayDate(r.SendToSectionDate) || '—'}
                    </td>
                    <td className="py-2 px-3 text-slate-500 dark:text-slate-400 max-w-xs truncate" title={r.Remarks || ''}>
                      {r.Remarks || '—'}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setEditingRecord(r)}
                          title="Edit this record"
                          className="p-1 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 rounded transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (onPrintRecords) {
                              onPrintRecords([r], `Record #${r.SerialNo}`);
                            } else {
                              exportToPdf([r], { title: `Volume Record #${r.SerialNo}` });
                            }
                          }}
                          title="Print this record"
                          className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ULTRA USER-FRIENDLY EDIT RECORD MODAL */}
      <EditRecordModal
        record={editingRecord}
        isOpen={editingRecord !== null}
        onClose={() => setEditingRecord(null)}
        onSave={handleSaveEdit}
        onPrintRequest={(rec) => {
          if (onPrintRecords) {
            onPrintRecords([rec], `Record #${rec.SerialNo}`);
          } else {
            exportToPdf([rec], { title: `Volume Record #${rec.SerialNo}` });
          }
        }}
      />
    </div>
  );
};
