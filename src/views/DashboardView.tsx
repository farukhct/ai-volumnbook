/**
 * VolumnBook — Dashboard Module
 * Shows live, real SQLite database metrics, stage pipeline, and recent volume entries.
 * NO dummy data.
 */

import React, { useEffect, useState } from 'react';
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  PlusCircle,
  Upload,
  ArrowRight,
  Edit2,
  Database,
  Search,
  Printer,
  Calendar,
  Layers,
} from 'lucide-react';
import { AppStats, VolumeRecord, NavigationModule } from '../types';
import { db } from '../lib/database';
import { formatToDisplayDate } from '../lib/dateUtils';
import { EditRecordModal } from '../components/EditRecordModal';

interface DashboardViewProps {
  onNavigate: (module: NavigationModule) => void;
  onSelectRecordForEdit?: (record: VolumeRecord) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<AppStats>({
    totalRecords: 0,
    withJudgementDate: 0,
    awaitingDraftDate: 0,
    awaitingFinalDate: 0,
    awaitingSendToSection: 0,
    completedRecords: 0,
  });
  const [recentRecords, setRecentRecords] = useState<VolumeRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [editingRecord, setEditingRecord] = useState<VolumeRecord | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const liveStats = await db.getStats();
      const all = await db.getRecords();
      setStats(liveStats);
      setRecentRecords(all.slice(0, 5));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveEdit = async (id: number, updates: Partial<VolumeRecord>) => {
    await db.updateRecord(id, updates);
    await loadData();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Executive Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time case and judgement volume pipeline metrics from local SQLite database.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('import')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-md transition-colors shadow-2xs"
            title="Import data from CSV"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Import CSV</span>
          </button>
          <button
            onClick={() => onNavigate('new-entry')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-md shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Record</span>
          </button>
          <button
            onClick={() => onNavigate('reports')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-md transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>View Reports</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Records */}
        <div className="bg-white dark:bg-slate-800/80 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span className="font-medium">Total Records</span>
            <Database className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {stats.totalRecords}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Total registered cases</div>
        </div>

        {/* With Judgement */}
        <div className="bg-white dark:bg-slate-800/80 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span className="font-medium">Judgement Given</span>
            <Calendar className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
              {stats.withJudgementDate}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Has judgement date</div>
        </div>

        {/* Awaiting Draft */}
        <div className="bg-white dark:bg-slate-800/80 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span className="font-medium">Awaiting Draft</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
              {stats.awaitingDraftDate}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Pending draft prep</div>
        </div>

        {/* Awaiting Final */}
        <div className="bg-white dark:bg-slate-800/80 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span className="font-medium">Awaiting Final</span>
            <AlertCircle className="w-4 h-4 text-orange-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-orange-600 dark:text-orange-400">
              {stats.awaitingFinalDate}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Pending final review</div>
        </div>

        {/* Awaiting Section */}
        <div className="bg-white dark:bg-slate-800/80 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span className="font-medium">Awaiting Section</span>
            <Send className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-400">
              {stats.awaitingSendToSection}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Ready to dispatch</div>
        </div>

        {/* Completed */}
        <div className="bg-white dark:bg-slate-800/80 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span className="font-medium">Completed</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {stats.completedRecords}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Sent to section</div>
        </div>
      </div>

      {/* Progress Pipeline Visualization */}
      <div className="bg-white dark:bg-slate-800/80 p-5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
          Workflow Pipeline Stages
        </h3>
        {stats.totalRecords === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            No volume records currently in database. Add records to visualize stage progression.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="h-3 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${(stats.withJudgementDate / stats.totalRecords) * 100}%` }}
                className="bg-indigo-500 h-full"
                title={`Judgement: ${stats.withJudgementDate}`}
              />
              <div
                style={{ width: `${(stats.awaitingDraftDate / stats.totalRecords) * 100}%` }}
                className="bg-amber-500 h-full"
                title={`Awaiting Draft: ${stats.awaitingDraftDate}`}
              />
              <div
                style={{ width: `${(stats.awaitingFinalDate / stats.totalRecords) * 100}%` }}
                className="bg-orange-500 h-full"
                title={`Awaiting Final: ${stats.awaitingFinalDate}`}
              />
              <div
                style={{ width: `${(stats.awaitingSendToSection / stats.totalRecords) * 100}%` }}
                className="bg-purple-500 h-full"
                title={`Awaiting Section: ${stats.awaitingSendToSection}`}
              />
              <div
                style={{ width: `${(stats.completedRecords / stats.totalRecords) * 100}%` }}
                className="bg-emerald-500 h-full"
                title={`Completed: ${stats.completedRecords}`}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-indigo-500" />
                <span>Judgement ({Math.round((stats.withJudgementDate / stats.totalRecords) * 100 || 0)}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-amber-500" />
                <span>Pending Draft ({Math.round((stats.awaitingDraftDate / stats.totalRecords) * 100 || 0)}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-orange-500" />
                <span>Pending Final ({Math.round((stats.awaitingFinalDate / stats.totalRecords) * 100 || 0)}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-purple-500" />
                <span>Pending Section ({Math.round((stats.awaitingSendToSection / stats.totalRecords) * 100 || 0)}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
                <span>Completed ({Math.round((stats.completedRecords / stats.totalRecords) * 100 || 0)}%)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Records or Empty State */}
      <div className="bg-white dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
              Recent Volume Records
            </h2>
          </div>
          {recentRecords.length > 0 && (
            <button
              onClick={() => onNavigate('all-records')}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>View All Records</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {recentRecords.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 mb-3">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No records found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
              The local database is clean and ready. Start by adding your first VolumnBook case record.
            </p>
            <button
              onClick={() => onNavigate('new-entry')}
              className="mt-4 flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ New Entry</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold">
                <tr>
                  <th className="py-2.5 px-4 w-16">Sl No</th>
                  <th className="py-2.5 px-4">Case No</th>
                  <th className="py-2.5 px-4">Judgement Date</th>
                  <th className="py-2.5 px-4">Draft Date</th>
                  <th className="py-2.5 px-4">Final Date</th>
                  <th className="py-2.5 px-4">Send to Section</th>
                  <th className="py-2.5 px-4">Remarks</th>
                  <th className="py-2.5 px-4 text-center w-20">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-750 text-slate-700 dark:text-slate-200">
                {recentRecords.map((r) => (
                  <tr key={r.Id} className="hover:bg-slate-50/80 dark:hover:bg-slate-750/50 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-medium text-slate-500 dark:text-slate-400">
                      {r.SerialNo}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-blue-600 dark:text-blue-400">
                      {r.CaseNo}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {formatToDisplayDate(r.JudgementDate) || '—'}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {formatToDisplayDate(r.DraftDate) || '—'}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {formatToDisplayDate(r.FinalDate) || '—'}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {formatToDisplayDate(r.SendToSectionDate) || '—'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                      {r.Remarks || '—'}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <button
                        onClick={() => setEditingRecord(r)}
                        className="p-1 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 rounded transition-colors"
                        title="Edit record"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Action Shortcuts Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div
          onClick={() => onNavigate('search')}
          className="p-3.5 bg-white dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer transition-colors flex items-center gap-3 shadow-xs"
        >
          <div className="p-2 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">On-Demand Search</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Multi-criteria query & filtering</p>
          </div>
        </div>

        <div
          onClick={() => onNavigate('import')}
          className="p-3.5 bg-white dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500 cursor-pointer transition-colors flex items-center gap-3 shadow-xs"
        >
          <div className="p-2 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">CSV Import Facility</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Bulk upload with column mapping</p>
          </div>
        </div>

        <div
          onClick={() => onNavigate('print')}
          className="p-3.5 bg-white dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 cursor-pointer transition-colors flex items-center gap-3 shadow-xs"
        >
          <div className="p-2 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">A4 Print Facility</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Court & volume registry format</p>
          </div>
        </div>

        <div
          onClick={() => onNavigate('backup')}
          className="p-3.5 bg-white dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer transition-colors flex items-center gap-3 shadow-xs"
        >
          <div className="p-2 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">Database Backup</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Safe SQLite timestamped backup</p>
          </div>
        </div>
      </div>

      {/* ULTRA USER-FRIENDLY EDIT RECORD MODAL */}
      <EditRecordModal
        record={editingRecord}
        isOpen={editingRecord !== null}
        onClose={() => setEditingRecord(null)}
        onSave={handleSaveEdit}
      />
    </div>
  );
};
