/**
 * VolumnBook — Dedicated Print Preview & Facility
 * Optimized for standard A4 paper, supports Portrait & Landscape modes,
 * prints without UI clutter.
 */

import React, { useState, useEffect } from 'react';
import { Printer, ArrowLeft, RotateCw } from 'lucide-react';
import { VolumeRecord, NavigationModule } from '../types';
import { db } from '../lib/database';
import { formatToDisplayDate, formatFullDateTime } from '../lib/dateUtils';

interface PrintViewProps {
  onNavigate: (module: NavigationModule) => void;
  preselectedRecords?: VolumeRecord[];
  reportTitle?: string;
  filterDescription?: string;
}

export const PrintView: React.FC<PrintViewProps> = ({
  onNavigate,
  preselectedRecords,
  reportTitle = 'All Volume Records Register',
  filterDescription = 'All Records',
}) => {
  const [records, setRecords] = useState<VolumeRecord[]>([]);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [isCompact, setIsCompact] = useState<boolean>(true);

  useEffect(() => {
    if (preselectedRecords && preselectedRecords.length > 0) {
      setRecords(preselectedRecords);
    } else {
      const fetchAll = async () => {
        const all = await db.getRecords();
        setRecords(all);
      };
      fetchAll();
    }
  }, [preselectedRecords]);

  const handleTriggerPrint = () => {
    window.print();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4 print:p-0 print:m-0">
      {/* Non-printing Control Toolbar */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('all-records')}
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
            title="Back to All Records"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Printer className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Print Preview (A4 Paper Formatted)
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ready to print {records.length} records. Review document formatting before dispatching to physical printer.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Orientation switch */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-md text-xs border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setOrientation('portrait')}
              className={`px-2.5 py-1 rounded transition-colors ${
                orientation === 'portrait'
                  ? 'bg-white dark:bg-slate-700 font-semibold text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Portrait
            </button>
            <button
              onClick={() => setOrientation('landscape')}
              className={`px-2.5 py-1 rounded transition-colors ${
                orientation === 'landscape'
                  ? 'bg-white dark:bg-slate-700 font-semibold text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Landscape
            </button>
          </div>

          <button
            onClick={handleTriggerPrint}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-md shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Send to Printer</span>
          </button>
        </div>
      </div>

      {/* The Printable A4 Sheet */}
      <div
        className={`bg-white text-slate-900 mx-auto shadow-lg border border-slate-300 print:border-none print:shadow-none p-8 transition-all ${
          orientation === 'landscape' ? 'max-w-[1100px] min-h-[750px]' : 'max-w-[850px] min-h-[1100px]'
        }`}
      >
        {/* Printable Official Header */}
        <div className="border-b-2 border-slate-900 pb-3 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black tracking-wider text-slate-900">VOLUMNBOOK</h1>
              <p className="text-xs text-slate-600 font-medium">Case & Judgement Volume Management System</p>
            </div>
            <div className="text-right text-[11px] text-slate-500 font-mono">
              <div>Printed: {formatFullDateTime(new Date())}</div>
              <div>Official Registry Record</div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs">
            <div>
              <strong className="text-slate-800">Report: </strong>
              <span className="font-semibold text-slate-900">{reportTitle}</span>
            </div>
            <div className="text-slate-600">
              <span>{filterDescription}</span>
              <span className="mx-2">·</span>
              <strong className="font-mono">Total Records: {records.length}</strong>
            </div>
          </div>
        </div>

        {/* Printable Table */}
        {records.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">No records available for printing.</div>
        ) : (
          <table className="w-full text-left text-[11px] border border-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400">
                <th className="py-1.5 px-2 border-r border-slate-300 w-10 text-center">Sl</th>
                <th className="py-1.5 px-3 border-r border-slate-300 min-w-[120px]">Case No</th>
                <th className="py-1.5 px-2 text-center border-r border-slate-300">Judgement Date</th>
                <th className="py-1.5 px-2 text-center border-r border-slate-300">Draft Date</th>
                <th className="py-1.5 px-2 text-center border-r border-slate-300">Final Date</th>
                <th className="py-1.5 px-2 text-center border-r border-slate-300">Send To Section</th>
                <th className="py-1.5 px-3">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {records.map((r, i) => (
                <tr key={r.Id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                  <td className="py-1.5 px-2 text-center font-mono font-bold text-slate-700 border-r border-slate-300">
                    {r.SerialNo}
                  </td>
                  <td className="py-1.5 px-3 font-semibold text-slate-900 border-r border-slate-300">
                    {r.CaseNo}
                  </td>
                  <td className="py-1.5 px-2 text-center font-mono border-r border-slate-300 whitespace-nowrap">
                    {formatToDisplayDate(r.JudgementDate) || '—'}
                  </td>
                  <td className="py-1.5 px-2 text-center font-mono border-r border-slate-300 whitespace-nowrap">
                    {formatToDisplayDate(r.DraftDate) || '—'}
                  </td>
                  <td className="py-1.5 px-2 text-center font-mono border-r border-slate-300 whitespace-nowrap">
                    {formatToDisplayDate(r.FinalDate) || '—'}
                  </td>
                  <td className="py-1.5 px-2 text-center font-mono border-r border-slate-300 whitespace-nowrap">
                    {formatToDisplayDate(r.SendToSectionDate) || '—'}
                  </td>
                  <td className="py-1.5 px-3 text-slate-700">
                    {r.Remarks || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Printable Footer */}
        <div className="mt-8 pt-3 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span>Generated by VolumnBook — Confidential Office Record</span>
          <span>Page 1 of 1</span>
        </div>
      </div>
    </div>
  );
};
