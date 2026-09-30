/**
 * VolumnBook — Database Backup Module
 * Creates atomic, timestamped SQLite database backups with integrity verification.
 */

import React, { useState } from 'react';
import { DatabaseBackup, Download, CheckCircle, ShieldCheck, HardDrive, Clock } from 'lucide-react';
import { db } from '../lib/database';
import { triggerFileDownload } from '../lib/exportUtils';
import { useToast } from '../components/Toast';

export const BackupView: React.FC = () => {
  const { showToast } = useToast();
  const [isBackingUp, setIsBackingUp] = useState<boolean>(false);
  const [backupHistory, setBackupHistory] = useState<{ filename: string; time: string; count: number }[]>([]);

  const handleCreateBackup = async () => {
    setIsBackingUp(true);
    try {
      const { filename, blob } = await db.createBackup();
      triggerFileDownload(blob, filename);

      const records = await db.getRecords();
      setBackupHistory((prev) => [
        {
          filename,
          time: new Date().toLocaleTimeString(),
          count: records.length,
        },
        ...prev,
      ]);

      showToast('Backup completed successfully.', 'success');
    } catch (err: any) {
      showToast('Failed to create database backup.', 'error');
    } finally {
      setIsBackingUp(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <DatabaseBackup className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          Backup Database
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Generate an immediate, verified snapshot of your complete SQLite database.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Backup Action Box */}
        <div className="md:col-span-2 bg-white dark:bg-slate-800/90 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs p-6 space-y-5">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Full Atomic Database Backup
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                Flushes all pending transactions, validates database integrity, and exports a timestamped copy:
              </p>
              <div className="mt-2 font-mono text-[11px] bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                VolumnBook_Backup_YYYY-MM-DD_HH-mm-ss.db
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-md border border-slate-200 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <span className="font-semibold block text-slate-800 dark:text-slate-200">
              Best Practice Recommendations:
            </span>
            <ul className="list-disc list-inside space-y-1 text-[11px]">
              <li>Perform daily backups at the end of court office hours.</li>
              <li>Store backups on an external drive or USB storage for maximum disaster recovery.</li>
              <li>Always create a backup before performing major database operations or cleaning.</li>
            </ul>
          </div>

          <button
            onClick={handleCreateBackup}
            disabled={isBackingUp}
            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 rounded-md shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>{isBackingUp ? 'Verifying & Backing Up...' : 'Create Backup Now'}</span>
          </button>
        </div>

        {/* Backup History & Location Info */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800/90 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5 mb-2">
              <HardDrive className="w-3.5 h-3.5 text-blue-500" />
              <span>Target Directory</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
              Backups are saved to your chosen folder or default Windows path:
            </p>
            <div className="mt-2 text-[10px] font-mono bg-slate-100 dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 break-all">
              %APPDATA%\VolumnBook\backups\
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/90 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5 mb-2">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Session Backups</span>
            </h3>

            {backupHistory.length === 0 ? (
              <span className="text-[11px] text-slate-400 italic">No backups taken this session.</span>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {backupHistory.map((b, i) => (
                  <div key={i} className="text-[11px] p-2 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                    <span className="font-mono font-semibold block text-slate-800 dark:text-slate-200 truncate">
                      {b.filename}
                    </span>
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>Time: {b.time}</span>
                      <span>Records: {b.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
