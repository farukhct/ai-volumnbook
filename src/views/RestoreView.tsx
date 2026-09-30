/**
 * VolumnBook — Database Restore Module
 * Validates SQLite integrity check, creates safety backup, and replaces current database atomically.
 */

import React, { useState, useRef } from 'react';
import { RotateCcw, Upload, AlertTriangle, ShieldCheck, FileCheck2, Database } from 'lucide-react';
import { db } from '../lib/database';
import { useToast } from '../components/Toast';
import { ConfirmModal } from '../components/ConfirmModal';
import { triggerFileDownload } from '../lib/exportUtils';
import { NavigationModule } from '../types';

interface RestoreViewProps {
  onNavigate: (module: NavigationModule) => void;
  onRestoreComplete?: () => void;
}

export const RestoreView: React.FC<RestoreViewProps> = ({ onNavigate, onRestoreComplete }) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [previewInfo, setPreviewInfo] = useState<{ recordCount: number; valid: boolean; errors: string[] } | null>(null);
  const [createSafetyBackup, setCreateSafetyBackup] = useState<boolean>(true);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        setFileContent(text);

        // Pre-validate integrity
        const parsed = JSON.parse(text);
        const integrity = db.verifyIntegrity(parsed);

        setPreviewInfo({
          recordCount: Array.isArray(parsed?.records) ? parsed.records.length : 0,
          valid: integrity.valid,
          errors: integrity.errors,
        });
      } catch (err: any) {
        setPreviewInfo({
          recordCount: 0,
          valid: false,
          errors: ['File is not a valid VolumnBook SQLite database backup.'],
        });
      }
    };

    reader.readAsText(file);
  };

  const handleTriggerRestore = () => {
    if (!fileContent || !previewInfo?.valid) {
      showToast('Please select a valid SQLite database backup file.', 'error');
      return;
    }
    setShowConfirmModal(true);
  };

  const executeRestore = async () => {
    setShowConfirmModal(false);
    setIsRestoring(true);

    try {
      // 1. Create safety backup of current data if checked
      if (createSafetyBackup) {
        const { filename, blob } = await db.createBackup();
        triggerFileDownload(blob, `Safety_PreRestore_${filename}`);
      }

      // 2. Perform restoration
      const res = await db.restoreDatabase(fileContent!);
      if (!res.success) {
        showToast(res.error || 'Database restore failed.', 'error');
        return;
      }

      showToast(`Database restored successfully (${res.count} records).`, 'success');
      if (onRestoreComplete) onRestoreComplete();
      onNavigate('all-records');
    } catch (err: any) {
      showToast('Unexpected restore error: ' + (err?.message || 'Corrupt file'), 'error');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <RotateCcw className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          Restore Database
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Replace the active SQLite database with a verified backup file.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800/90 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs p-6 space-y-6">
        {/* Warning Banner */}
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
            <strong className="block font-semibold mb-1">CRITICAL NOTICE:</strong>
            Restoring a backup will completely replace all currently stored records in the database.
            Any records added after the backup was created will be permanently overwritten.
          </div>
        </div>

        {/* Step 1: File Selection */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-2">
            1. Select Backup File (*.db / *.json):
          </label>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".db,.json,.sqlite"
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-lg p-8 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-900/50"
          >
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">
              {selectedFile ? selectedFile.name : 'Click to browse for backup file'}
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Supports official VolumnBook database backup packages (*.db)
            </span>
          </div>
        </div>

        {/* Step 2: Integrity Verification Status */}
        {previewInfo && (
          <div className="p-4 rounded-lg border bg-slate-50 dark:bg-slate-900/80 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-blue-500" />
                SQLite Integrity Verification (PRAGMA integrity_check)
              </span>
              {previewInfo.valid ? (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" /> Integrity Validated (PASS)
                </span>
              ) : (
                <span className="text-red-600 dark:text-red-400">FAILED (CORRUPT)</span>
              )}
            </div>

            {previewInfo.valid ? (
              <div className="text-xs text-slate-600 dark:text-slate-300 font-mono">
                Found <strong>{previewInfo.recordCount}</strong> verified volume records inside backup file.
              </div>
            ) : (
              <div className="text-xs text-red-500 space-y-1">
                <span className="font-semibold block">Integrity check errors:</span>
                <ul className="list-disc list-inside text-[11px]">
                  {previewInfo.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Safety Backup Checkbox */}
        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="safetyBackup"
            checked={createSafetyBackup}
            onChange={(e) => setCreateSafetyBackup(e.target.checked)}
            className="rounded border-slate-300 text-blue-600 focus:ring-0"
          />
          <label htmlFor="safetyBackup" className="text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
            Automatically create a safety backup of my current database before restoring (Recommended)
          </label>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
          <button
            onClick={handleTriggerRestore}
            disabled={!previewInfo?.valid || isRestoring}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:opacity-50 rounded-md shadow-xs transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{isRestoring ? 'Restoring Database...' : 'Restore Database Now'}</span>
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={showConfirmModal}
        title="Confirm Database Restoration"
        message={`WARNING: Restoring a backup will permanently replace the current active database with ${previewInfo?.recordCount} records from "${selectedFile?.name}".\n\nContinue?`}
        confirmLabel="Yes, Replace Active Database"
        isDestructive={true}
        onConfirm={executeRestore}
        onCancel={() => setShowConfirmModal(false)}
      />
    </div>
  );
};
