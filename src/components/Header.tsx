/**
 * VolumnBook — Desktop Window Titlebar & Header
 * Native Windows desktop styling with controls, system clock, and status indicators.
 */

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Minus,
  Square,
  X,
  Menu,
  Moon,
  Sun,
  Database,
  WifiOff,
  PlusCircle,
  Search,
} from 'lucide-react';
import { formatFullDateTime } from '../lib/dateUtils';
import { NavigationModule } from '../types';

interface HeaderProps {
  currentModule: NavigationModule;
  onNavigate: (module: NavigationModule) => void;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  totalRecordsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentModule,
  onNavigate,
  sidebarCollapsed,
  onToggleSidebar,
  theme,
  onToggleTheme,
  totalRecordsCount,
}) => {
  const [currentDateTime, setCurrentDateTime] = useState<string>(formatFullDateTime(new Date()));
  const [isMaximized, setIsMaximized] = useState<boolean>(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(formatFullDateTime(new Date()));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleMinimize = () => {
    // In Electron, ipcRenderer would minimize window
    console.log('Window minimize requested');
  };

  const handleMaximize = () => {
    setIsMaximized(!isMaximized);
    console.log('Window maximize requested');
  };

  const handleClose = () => {
    console.log('Window close requested');
  };

  return (
    <header className="bg-slate-900 text-slate-100 border-b border-slate-800 select-none flex-shrink-0 z-30">
      {/* Top Windows Native-style Titlebar */}
      <div className="flex items-center justify-between px-3 py-1.5 text-xs border-b border-slate-800/80 bg-slate-950">
        <div className="flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-semibold tracking-wide text-slate-200">
            VolumnBook — Case & Judgement Volume Management System
          </span>
          <span className="text-[10px] text-slate-400 px-1.5 py-0.2 bg-slate-800 rounded font-mono">
            v1.0.0
          </span>
        </div>

        {/* Windows Window Controls */}
        <div className="flex items-center">
          <button
            onClick={handleMinimize}
            title="Minimize"
            className="px-3 py-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Minus className="w-3 h-3" />
          </button>
          <button
            onClick={handleMaximize}
            title={isMaximized ? 'Restore Down' : 'Maximize'}
            className="px-3 py-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Square className="w-2.5 h-2.5" />
          </button>
          <button
            onClick={handleClose}
            title="Close"
            className="px-3 py-1 hover:bg-red-600 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Main Navigation Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white tracking-tight">VolumnBook</span>
            <span className="text-xs text-slate-400 hidden sm:inline">| Official Legal Registry</span>
          </div>

          {/* Quick Action Buttons */}
          <div className="hidden md:flex items-center gap-1.5 ml-4 pl-4 border-l border-slate-700/60">
            <button
              onClick={() => onNavigate('new-entry')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                currentModule === 'new-entry'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Entry</span>
              <kbd className="text-[10px] text-slate-400 font-mono ml-1">Ctrl+N</kbd>
            </button>

            <button
              onClick={() => onNavigate('search')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                currentModule === 'search'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
              <kbd className="text-[10px] text-slate-400 font-mono ml-1">Ctrl+F</kbd>
            </button>
          </div>
        </div>

        {/* Right Status Indicators */}
        <div className="flex items-center gap-3 text-xs">
          {/* Database Status Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded border border-slate-700">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] font-medium">SQLite Active</span>
            <span className="text-slate-500 text-[10px]">·</span>
            <span className="text-[11px] text-slate-300">{totalRecordsCount} records</span>
          </div>

          {/* 100% Offline Badge */}
          <div className="hidden sm:flex items-center gap-1.5 text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded border border-slate-700">
            <WifiOff className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[11px] font-medium">100% Offline</span>
          </div>

          {/* System Date & Time */}
          <div className="font-mono text-[11px] text-slate-300 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
            {currentDateTime}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
