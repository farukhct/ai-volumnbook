/**
 * VolumnBook — One-Click Clean Database Module
 * Protected destructive action that permanently purges records and resets sequence.
 * Zero dummy data.
 */

import React, { useState } from 'react';
import { Trash2, AlertOctagon, ShieldAlert, Download, RefreshCw } from 'lucide-react';
import { db } from '../lib/database';
import { useToast } from '../components/Toast';
import { ConfirmModal } from '../components/ConfirmModal';
import { triggerFileDownload } from '../lib/exportUtils';
import { NavigationModule } from '../types';

interface CleanDatabaseViewProps {
  onNavigate: (module: NavigationModule) => void;
  onCleanComplete?: () => void;
}

export const CleanDatabaseView: React.FC<CleanDatabaseViewProps> = ({ onNavigate, onCleanComplete }) => {
  const { showToast } = useToast();
  const [createSafetyBackup, setCreateSafetyBackup] = useState<boolean>(true);
  const [showConfirm, setShowConfirm] = useState<boolean>(false);
  const [isCleaning, setIsCleaning] = useState<boolean>(false);

  const handleClean = async () => {
    setShowConfirm(false);
    setIsCleaning(true);

    try {
      // 1. Take safety backup if opted in
      if (createSafetyBackup) {
        const { filename, blob } = await db.createBackup();
        triggerFileDownload(blob, `PreClean_${filename}`);
      }

      // 2. Perform database cleaning
      await db.cleanDatabase();

      showToast('Database cleaned successfully. Record count = 0.', 'success');
      if (onCleanComplete) onCleanComplete();
      onNavigate('dashboard');
    } catch (err: any) {
      showToast('Failed to clean database.', 'error');
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-xl font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
          <Trash2 className="w-5 h-5" />
          Clean Database
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Permanently purge all case volume records and reset auto-incremented serial numbering.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800/90 rounded-lg border border-red-200 dark:border-red-900/60 shadow-xs p-6 space-y-6">
        {/* Prominent Red Alert Banner */}
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 rounded-lg flex items-start gap-3">
          <ShieldAlert className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" />
          <div className="text-xs text-red-900 dark:text-red-200 leading-relaxed">
            <strong className="block font-bold text-sm mb-1">
              WARNING: Irreversible Database Truncation
            </strong>
            This action will permanently delete ALL VolumnBook case records from the local SQLite database.
            Serial number sequencing will be reset back to #1.
            This action cannot be undone unless an existing backup file is retained.
          </div>
        </div>

        {/* Protection Checklist */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-md border border-slate-200 dark:border-slate-800 space-y-2 text-xs text-slate-700 dark:text-slate-300">
          <span className="font-semibold block text-slate-900 dark:text-slate-100">
            What this action does:
          </span>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
            <li>Deletes all records from the VolumeBook table.</li>
            <li>Resets the automatic Serial No counter to start from 1 for future records.</li>
            <li>Maintains application configuration and database schema structure.</li>
            <li>Inserts ZERO dummy or sample records. Total record count will equal 0.</li>
          </ul>
        </div>

        {/* Safety Backup Option */}
        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="safetyClean"
            checked={createSafetyBackup}
            onChange={(e) => setCreateSafetyBackup(e.target.checked)}
            className="rounded border-slate-300 text-red-600 focus:ring-0"
          />
          <label htmlFor="safetyClean" className="text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
            Automatically download a safety backup before purging records (Recommended)
          </label>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
          <button
            onClick={() => setShowConfirm(true)}
            disabled={isCleaning}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 rounded-md shadow-xs transition-colors"
          >
            <AlertOctagon className="w-4 h-4" />
            <span>{isCleaning ? 'Purging Database...' : 'Clean Database (Reset Records)'}</span>
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        title="Confirm Complete Database Purge"
        message="WARNING: This will permanently remove all VolumnBook records. This action cannot be undone unless a backup exists.\n\nAre you sure you want to proceed?"
        confirmLabel="Yes, Permanently Clean Database"
        isDestructive={true}
        onConfirm={handleClean}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
};
