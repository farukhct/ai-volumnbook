/**
 * VolumnBook — All Records (Main Data Grid)
 * Professional data table with sorting, pagination, column alignment, view modal,
 * edit modal, delete confirmation, quick print, and multi-format export.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  TableProperties,
  Search,
  Eye,
  Edit2,
  Trash2,
  Printer,
  FileSpreadsheet,
  FileText,
  PlusCircle,
  Upload,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  X,
  Save,
  RotateCcw,
} from 'lucide-react';
import { VolumeRecord, NavigationModule } from '../types';
import { db } from '../lib/database';
import { formatToDisplayDate, validateDateSequence } from '../lib/dateUtils';
import { DatePickerInput } from '../components/DatePickerInput';
import { ConfirmModal } from '../components/ConfirmModal';
import { EditRecordModal } from '../components/EditRecordModal';
import { useToast } from '../components/Toast';
import { exportToPdf, exportToDocx, exportToExcel } from '../lib/exportUtils';
import { exportRecordsToCsv } from '../lib/csvUtils';

interface AllRecordsViewProps {
  onNavigate: (module: NavigationModule) => void;
  onPrintRecords?: (records: VolumeRecord[], title: string) => void;
}

export const AllRecordsView: React.FC<AllRecordsViewProps> = ({ onNavigate, onPrintRecords }) => {
  const { showToast } = useToast();
  const [records, setRecords] = useState<VolumeRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);

  // Sorting state
  const [sortField, setSortField] = useState<keyof VolumeRecord>('SerialNo');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Selection for batch actions
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Modals state
  const [viewingRecord, setViewingRecord] = useState<VolumeRecord | null>(null);
  const [editingRecord, setEditingRecord] = useState<VolumeRecord | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<VolumeRecord | null>(null);

  const loadRecords = async () => {
    setIsLoading(true);
    try {
      const data = await db.getRecords();
      setRecords(data);
    } catch (err: any) {
      showToast('Failed to load records from database.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  // Filtered and sorted records
  const processedRecords = useMemo(() => {
    let result = [...records];

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      result = result.filter(
        (r) =>
          String(r.SerialNo).includes(term) ||
          r.CaseNo.toLowerCase().includes(term) ||
          (r.JudgementDate && r.JudgementDate.toLowerCase().includes(term)) ||
          (r.DraftDate && r.DraftDate.toLowerCase().includes(term)) ||
          (r.FinalDate && r.FinalDate.toLowerCase().includes(term)) ||
          (r.SendToSectionDate && r.SendToSectionDate.toLowerCase().includes(term)) ||
          (r.Remarks && r.Remarks.toLowerCase().includes(term))
      );
    }

    result.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return sortDirection === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });

    return result;
  }, [records, searchTerm, sortField, sortDirection]);

  // Paginated records
  const totalPages = Math.max(1, Math.ceil(processedRecords.length / pageSize));
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return processedRecords.slice(startIndex, startIndex + pageSize);
  }, [processedRecords, currentPage, pageSize]);

  const handleSort = (field: keyof VolumeRecord) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Selection toggle
  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedRecords.length && paginatedRecords.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedRecords.map((r) => r.Id)));
    }
  };

  const toggleSelectOne = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // Open Edit Modal
  const startEdit = (record: VolumeRecord) => {
    setEditingRecord(record);
  };

  const handleSaveEdit = async (id: number, updates: Partial<VolumeRecord>) => {
    await db.updateRecord(id, updates);
    await loadRecords();
  };

  // Delete Action
  const confirmDelete = async () => {
    if (!deleteCandidate) return;
    try {
      await db.deleteRecord(deleteCandidate.Id);
      showToast('Record deleted successfully.', 'success');
      setDeleteCandidate(null);
      await loadRecords();
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete record.', 'error');
    }
  };

  // Quick single-record print
  const handlePrintSingleRecord = (rec: VolumeRecord) => {
    if (onPrintRecords) {
      onPrintRecords([rec], `Record #${rec.SerialNo} (${rec.CaseNo})`);
    } else {
      exportToPdf([rec], { title: `Volume Record #${rec.SerialNo} (${rec.CaseNo})` });
    }
  };

  // Export current view records
  const handleExportCsv = () => {
    exportRecordsToCsv(processedRecords);
    showToast('CSV file exported successfully.', 'success');
  };

  const handleExportPdf = () => {
    exportToPdf(processedRecords, { title: 'All Volume Records' });
    showToast('PDF exported successfully.', 'success');
  };

  const handleExportDocx = () => {
    exportToDocx(processedRecords, { title: 'All Volume Records' });
    showToast('Word document exported successfully.', 'success');
  };

  const handleExportExcel = (format: 'xls' | 'xlsx' = 'xls') => {
    exportToExcel(processedRecords, format, { title: 'All Volume Records' });
    showToast(`Excel file (.${format}) exported successfully.`, 'success');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      {/* Top Banner & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <TableProperties className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            All Volume Records
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Displaying {processedRecords.length} of {records.length} registered volume items.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export Dropdown / Buttons */}
          <div className="flex items-center rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5 text-xs">
            <button
              onClick={handleExportCsv}
              title="Export as CSV (.csv)"
              className="px-2 py-1 text-slate-700 dark:text-slate-300 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors font-medium"
            >
              CSV
            </button>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <button
              onClick={handleExportPdf}
              title="Export as PDF"
              className="px-2 py-1 text-slate-700 dark:text-slate-300 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
            >
              PDF
            </button>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <button
              onClick={handleExportDocx}
              title="Export as Word (.docx)"
              className="px-2 py-1 text-slate-700 dark:text-slate-300 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
            >
              DOCX
            </button>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <button
              onClick={() => handleExportExcel('xls')}
              title="Export as Excel (.xls)"
              className="px-2 py-1 text-slate-700 dark:text-slate-300 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
            >
              XLS
            </button>
          </div>

          {/* Import CSV Button */}
          <button
            onClick={() => onNavigate('import')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-md transition-colors shadow-2xs"
            title="Import data from CSV file"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={() => onNavigate('print')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-md transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print View</span>
          </button>

          <button
            onClick={() => onNavigate('new-entry')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ New Entry</span>
          </button>
        </div>
      </div>

      {/* Search & Page Size Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-800/80 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Quick search serial, case, dates, remarks..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-600"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 self-end sm:self-center">
          <div className="flex items-center gap-1.5">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <span className="font-mono text-slate-400">
            Page {currentPage} of {totalPages}
          </span>
        </div>
      </div>

      {/* Main Table Grid */}
      <div className="bg-white dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        {paginatedRecords.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <TableProperties className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No records found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {searchTerm ? 'No volume records match your search filter.' : 'Start by adding your first VolumnBook record.'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => onNavigate('new-entry')}
                className="mt-4 flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ New Entry</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              {/* Sticky Table Header */}
              <thead className="bg-slate-100 dark:bg-slate-900 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold select-none">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === paginatedRecords.length && paginatedRecords.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 text-blue-600 focus:ring-0"
                    />
                  </th>

                  <th
                    onClick={() => handleSort('SerialNo')}
                    className="py-2.5 px-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors w-20 text-center"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Serial No</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('CaseNo')}
                    className="py-2.5 px-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors min-w-[140px]"
                  >
                    <div className="flex items-center gap-1">
                      <span>Case No</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('JudgementDate')}
                    className="py-2.5 px-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-center w-32"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Judgement Date</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('DraftDate')}
                    className="py-2.5 px-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-center w-32"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Draft Date</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('FinalDate')}
                    className="py-2.5 px-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-center w-32"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Final Date</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('SendToSectionDate')}
                    className="py-2.5 px-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-center w-36"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Send to Section</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>

                  <th className="py-2.5 px-3 min-w-[160px]">Remarks</th>

                  <th className="py-2.5 px-3 text-center w-36 sticky right-0 bg-slate-100 dark:bg-slate-900 shadow-xs">
                    Actions
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-slate-100 dark:divide-slate-750 text-slate-700 dark:text-slate-200">
                {paginatedRecords.map((r) => {
                  const isSelected = selectedIds.has(r.Id);

                  return (
                    <tr
                      key={r.Id}
                      className={`hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors ${
                        isSelected ? 'bg-blue-50/80 dark:bg-blue-900/30' : ''
                      }`}
                    >
                      <td className="py-2 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(r.Id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-0"
                        />
                      </td>

                      <td className="py-2 px-3 text-center font-mono font-bold text-slate-600 dark:text-slate-300">
                        {r.SerialNo}
                      </td>

                      <td className="py-2 px-3 font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">
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

                      {/* Row Actions */}
                      <td className="py-2 px-3 text-center whitespace-nowrap sticky right-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xs">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setViewingRecord(r)}
                            title="View Record Details"
                            className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => startEdit(r)}
                            title="Edit Record"
                            className="p-1 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 rounded transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handlePrintSingleRecord(r)}
                            title="Print Record"
                            className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setDeleteCandidate(r)}
                            title="Delete Record"
                            className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {processedRecords.length > 0 && (
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, processedRecords.length)} of {processedRecords.length} records
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 rounded transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 font-mono text-slate-700 dark:text-slate-200">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 rounded transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* VIEW DETAIL MODAL */}
      {viewingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Volume Record Details #{viewingRecord.SerialNo}
                </h3>
              </div>
              <button
                onClick={() => setViewingRecord(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded border border-slate-200 dark:border-slate-750">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Serial No</span>
                  <span className="text-sm font-bold font-mono text-slate-800 dark:text-slate-100">
                    #{viewingRecord.SerialNo}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Case No</span>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {viewingRecord.CaseNo}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 rounded border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Judgement Date</span>
                  <span className="font-mono text-slate-700 dark:text-slate-200">
                    {formatToDisplayDate(viewingRecord.JudgementDate) || 'Not recorded'}
                  </span>
                </div>
                <div className="p-2.5 rounded border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Draft Date</span>
                  <span className="font-mono text-slate-700 dark:text-slate-200">
                    {formatToDisplayDate(viewingRecord.DraftDate) || 'Not recorded'}
                  </span>
                </div>
                <div className="p-2.5 rounded border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Final Date</span>
                  <span className="font-mono text-slate-700 dark:text-slate-200">
                    {formatToDisplayDate(viewingRecord.FinalDate) || 'Not recorded'}
                  </span>
                </div>
                <div className="p-2.5 rounded border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Send To Section Date</span>
                  <span className="font-mono text-slate-700 dark:text-slate-200">
                    {formatToDisplayDate(viewingRecord.SendToSectionDate) || 'Not recorded'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-semibold block uppercase mb-1">Remarks</span>
                <p className="p-3 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 whitespace-pre-wrap min-h-[60px]">
                  {viewingRecord.Remarks || 'No remarks recorded.'}
                </p>
              </div>

              <div className="pt-2 text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                <span>Created: {new Date(viewingRecord.CreatedAt).toLocaleString()}</span>
                {viewingRecord.UpdatedAt && <span>Updated: {new Date(viewingRecord.UpdatedAt).toLocaleString()}</span>}
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => {
                  handlePrintSingleRecord(viewingRecord);
                  setViewingRecord(null);
                }}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-50"
              >
                Print Record
              </button>
              <button
                onClick={() => setViewingRecord(null)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ULTRA USER-FRIENDLY EDIT RECORD MODAL */}
      <EditRecordModal
        record={editingRecord}
        isOpen={editingRecord !== null}
        onClose={() => setEditingRecord(null)}
        onSave={handleSaveEdit}
        onDeleteRequest={(rec) => setDeleteCandidate(rec)}
        onPrintRequest={(rec) => handlePrintSingleRecord(rec)}
      />

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={deleteCandidate !== null}
        title="Delete Volume Record"
        message={`Are you sure you want to delete Case No "${deleteCandidate?.CaseNo}" (Serial No #${deleteCandidate?.SerialNo})?\n\nThis record will be permanently deleted from the database.`}
        confirmLabel="Yes, Delete Record"
        isDestructive={true}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteCandidate(null)}
      />
    </div>
  );
};
