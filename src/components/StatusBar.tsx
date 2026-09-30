/**
 * VolumnBook — Windows Bottom Status Bar
 * Displays live database health, current record count, connection state, and keyboard shortcuts.
 */

import React from 'react';
import { Database, WifiOff, HardDrive, Keyboard } from 'lucide-react';
import { formatToDisplayDate, getTodayDbDate } from '../lib/dateUtils';
import { NavigationModule } from '../types';

interface StatusBarProps {
  totalRecordsCount: number;
  currentModule: NavigationModule;
  lastActionMessage?: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  totalRecordsCount,
  currentModule,
  lastActionMessage,
}) => {
  const todayFormatted = formatToDisplayDate(getTodayDbDate());

  return (
    <footer className="h-6 bg-slate-900 border-t border-slate-800 text-slate-300 text-[11px] px-3 flex items-center justify-between select-none flex-shrink-0 z-30 font-mono">
      {/* Left items: Active operation or Database status */}
      <div className="flex items-center gap-3 truncate">
        <div className="flex items-center gap-1.5 text-emerald-400">
          <Database className="w-3 h-3" />
          <span className="font-sans text-[11px] text-slate-300">VolumnBook.db (Active)</span>
        </div>

        <span className="text-slate-600">|</span>

        <div className="flex items-center gap-1 text-slate-400 truncate">
          <HardDrive className="w-3 h-3 text-blue-400" />
          <span>Records: <strong className="text-slate-200">{totalRecordsCount}</strong></span>
        </div>

        {lastActionMessage && (
          <>
            <span className="text-slate-600">|</span>
            <span className="text-blue-400 font-sans truncate text-[11px]">{lastActionMessage}</span>
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
