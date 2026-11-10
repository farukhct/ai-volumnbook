/**
 * VolumnBook — Windows Bottom Status Bar
 * Displays live database health, current record count, connection state, keyboard shortcuts,
 * and prominent real-time animated feedback when working or processing background operations.
 */

import React from 'react';
import { Database, WifiOff, HardDrive, Keyboard, Loader2, Activity } from 'lucide-react';
import { formatToDisplayDate, getTodayDbDate } from '../lib/dateUtils';
import { NavigationModule } from '../types';

interface StatusBarProps {
  totalRecordsCount: number;
  currentModule: NavigationModule;
  lastActionMessage?: string;
  isWorking?: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  totalRecordsCount,
  currentModule,
  lastActionMessage,
  isWorking = false,
}) => {
  const todayFormatted = formatToDisplayDate(getTodayDbDate());

  // Check if message indicates active background work
  const msgLower = (lastActionMessage || '').toLowerCase();
  const isActivelyWorking =
    isWorking ||
    msgLower.includes('working') ||
    msgLower.includes('processing') ||
    msgLower.includes('importing') ||
    msgLower.includes('exporting') ||
    msgLower.includes('backing up') ||
    msgLower.includes('restoring') ||
    msgLower.includes('saving') ||
    msgLower.includes('purging') ||
    msgLower.includes('loading') ||
    msgLower.includes('cleaning');

  return (
    <footer className="relative h-6 bg-slate-900 border-t border-slate-800 text-slate-300 text-[11px] px-3 flex items-center justify-between select-none flex-shrink-0 z-30 font-mono">
      {/* Top Animated Shimmer Bar when Working */}
      {isActivelyWorking && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-slate-800 overflow-hidden">
          <div className="h-full w-1/3 bg-gradient-to-r from-blue-500 via-indigo-400 to-emerald-400 animate-shimmer" />
        </div>
      )}

      {/* Left items: Active operation or Database status */}
      <div className="flex items-center gap-3 truncate">
        {/* Database state with animated activity indicator */}
        <div className="flex items-center gap-1.5 text-emerald-400">
          {isActivelyWorking ? (
            <div className="relative flex items-center justify-center">
              <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-blue-400 opacity-75" />
              <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
            </div>
          ) : (
            <Database className="w-3 h-3" />
          )}
          <span className="font-sans text-[11px] text-slate-300">
            {isActivelyWorking ? (
              <span className="text-blue-400 font-semibold flex items-center gap-1">
                <span>Working</span>
                <span className="animate-pulse">...</span>
              </span>
            ) : (
              'VolumnBook.db (Active)'
            )}
          </span>
        </div>

        <span className="text-slate-600">|</span>

        <div className="flex items-center gap-1 text-slate-400 truncate">
          <HardDrive className="w-3 h-3 text-blue-400" />
          <span>Records: <strong className="text-slate-200">{totalRecordsCount}</strong></span>
        </div>

        {lastActionMessage && (
          <>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1.5 truncate">
              {isActivelyWorking && (
                <Activity className="w-3 h-3 text-blue-400 animate-pulse flex-shrink-0" />
              )}
              <span className={`font-sans truncate text-[11px] ${
                isActivelyWorking ? 'text-blue-300 font-medium' : 'text-blue-400'
              }`}>
                {lastActionMessage}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Right items: Mode, shortcuts, system date */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1 text-slate-400">
          <Keyboard className="w-3 h-3 text-slate-400" />
          <span className="text-[10px]">Shortcuts: Ctrl+N, Ctrl+F, Ctrl+P, Ctrl+B</span>
        </div>

        <span className="hidden sm:inline text-slate-600">|</span>

        <div className="flex items-center gap-1 text-blue-400">
          <WifiOff className="w-3 h-3" />
          <span className="text-[10px]">Offline</span>
        </div>

        <span className="text-slate-600">|</span>

        <div className="text-slate-300 text-[10px]">
          {todayFormatted}
        </div>
      </div>
    </footer>
  );
};
