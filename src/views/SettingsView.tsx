/**
 * VolumnBook — Settings & Configuration Module
 * Manages theme, report defaults, database paths, and local log inspection.
 */

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Moon,
  Sun,
  HardDrive,
  FileCode,
  FileText,
  Keyboard,
  RotateCcw,
  CheckCircle,
} from 'lucide-react';
import { AppSettings, LogEntry } from '../types';
import { logger } from '../lib/logger';
import { useToast } from '../components/Toast';

interface SettingsViewProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ theme, onToggleTheme }) => {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [defaultOrientation, setDefaultOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [autoBackup, setAutoBackup] = useState<boolean>(true);

  useEffect(() => {
    setLogs(logger.getLogs());
  }, []);

  const handleClearLogs = () => {
    logger.clearLogs();
    setLogs([]);
    showToast('Application logs cleared.', 'info');
  };

  const handleExportLogs = () => {
    const text = logger.exportLogFileContent();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `volumnbook_log_${new Date().toISOString().slice(0, 10)}.log`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Log file exported successfully.', 'success');
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          Application Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Configure interface appearance, database directories, report preferences, and inspect system logs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Appearance & Themes */}
        <div className="bg-white dark:bg-slate-800/90 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs p-5 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Appearance & Display
          </h2>

          <div className="flex items-center justify-between p-3 rounded-md bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                Visual Theme
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Current mode: {theme === 'dark' ? 'Dark Theme' : 'Light Theme'}
              </span>
            </div>
            <button
              onClick={onToggleTheme}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" /> Switch to Light
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-blue-500" /> Switch to Dark
                </>
              )}
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Default Date Display Format
            </label>
            <input
              type="text"
              disabled
              value="dd-MM-yyyy (Strict Office Standard)"
              className="w-full px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded font-mono text-slate-500 cursor-not-allowed"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Default Report Orientation
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDefaultOrientation('landscape')}
                className={`flex-1 py-1.5 text-xs font-medium rounded border ${
                  defaultOrientation === 'landscape'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                Landscape (Recommended)
              </button>
              <button
                onClick={() => setDefaultOrientation('portrait')}
                className={`flex-1 py-1.5 text-xs font-medium rounded border ${
                  defaultOrientation === 'portrait'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                Portrait
              </button>
            </div>
          </div>
        </div>

        {/* Database Directory Information */}
        <div className="bg-white dark:bg-slate-800/90 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs p-5 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Database & File Architecture
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                Primary Database File
              </span>
              <div className="mt-1 font-mono text-[11px] p-2 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 break-all">
                %APPDATA%\VolumnBook\data\VolumnBook.db
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                Backups Storage Path
              </span>
              <div className="mt-1 font-mono text-[11px] p-2 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 break-all">
                %APPDATA%\VolumnBook\backups\
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                Application Logs Path
              </span>
              <div className="mt-1 font-mono text-[11px] p-2 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 break-all">
                %APPDATA%\VolumnBook\logs\volumnbook.log
              </div>
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts Reference */}
        <div className="bg-white dark:bg-slate-800/90 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs p-5 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Keyboard className="w-4 h-4 text-blue-500" />
            <span>Keyboard Shortcuts</span>
          </h2>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-400">New Entry</span>
              <kbd className="font-mono text-[10px] bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 font-bold">
                Ctrl + N
              </kbd>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-400">Search Records</span>
              <kbd className="font-mono text-[10px] bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 font-bold">
                Ctrl + F
              </kbd>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-400">Print Preview</span>
              <kbd className="font-mono text-[10px] bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 font-bold">
                Ctrl + P
              </kbd>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-400">Save Form</span>
              <kbd className="font-mono text-[10px] bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 font-bold">
                Ctrl + S
              </kbd>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-400">Backup Database</span>
              <kbd className="font-mono text-[10px] bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 font-bold">
                Ctrl + B
              </kbd>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-400">Dismiss Modal</span>
              <kbd className="font-mono text-[10px] bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 font-bold">
                Escape
              </kbd>
            </div>
          </div>
        </div>

        {/* Application System Logs Viewer */}
        <div className="bg-white dark:bg-slate-800/90 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-emerald-500" />
              <span>System Activity Log</span>
            </h2>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleExportLogs}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
              >
                Export Log File
              </button>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <button
                onClick={handleClearLogs}
                className="text-[11px] text-red-500 hover:underline"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="bg-slate-950 text-slate-300 p-3 rounded font-mono text-[10px] max-h-40 overflow-y-auto space-y-1">
            {logs.length === 0 ? (
              <span className="text-slate-600">No log entries available.</span>
            ) : (
              logs.map((l) => (
                <div key={l.id} className="leading-tight">
                  <span className="text-slate-500">[{l.timestamp}]</span>{' '}
                  <span
                    className={
                      l.level === 'ERROR'
                        ? 'text-red-400 font-bold'
                        : l.level === 'WARN'
                        ? 'text-amber-400'
                        : 'text-blue-400'
                    }
                  >
                    [{l.category}]
                  </span>{' '}
                  <span>{l.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
