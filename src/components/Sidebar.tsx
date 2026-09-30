/**
 * VolumnBook — Collapsible Left Sidebar Navigation
 * Hosts all 12 modules with professional office typography and keyboard indicators.
 */

import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  TableProperties,
  Search,
  FileText,
  Printer,
  FileSpreadsheet,
  Upload,
  DatabaseBackup,
  RotateCcw,
  Trash2,
  Settings,
  Info,
} from 'lucide-react';
import { NavigationModule } from '../types';

interface SidebarProps {
  currentModule: NavigationModule;
  onNavigate: (module: NavigationModule) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  totalRecordsCount: number;
}

interface NavItemConfig {
  id: NavigationModule;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  badge?: number | string;
  destructive?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentModule,
  onNavigate,
  collapsed,
  totalRecordsCount,
}) => {
  const navItems: NavItemConfig[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'new-entry', label: 'New Entry', icon: PlusCircle, shortcut: 'Ctrl+N' },
    { id: 'all-records', label: 'All Records', icon: TableProperties, badge: totalRecordsCount },
    { id: 'search', label: 'Search', icon: Search, shortcut: 'Ctrl+F' },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'print', label: 'Print', icon: Printer, shortcut: 'Ctrl+P' },
    { id: 'export', label: 'Export', icon: FileSpreadsheet, shortcut: 'Ctrl+E' },
    { id: 'import', label: 'Import CSV', icon: Upload, shortcut: 'Ctrl+I' },
    { id: 'backup', label: 'Backup Database', icon: DatabaseBackup, shortcut: 'Ctrl+B' },
    { id: 'restore', label: 'Restore Database', icon: RotateCcw },
    { id: 'clean', label: 'Clean Database', icon: Trash2, destructive: true },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'about', label: 'About', icon: Info },
  ];

  return (
    <aside
      className={`bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col justify-between transition-all duration-200 select-none flex-shrink-0 z-20 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Navigation List */}
      <div className="py-2 overflow-y-auto flex-1 custom-scrollbar">
        <div className="px-3 mb-2">
          {!collapsed && (
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
              Modules
            </div>
          )}
        </div>

        <nav className="space-y-0.5 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentModule === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-md transition-colors text-left group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : item.destructive
                    ? 'text-red-400 hover:bg-red-950/40 hover:text-red-300'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <Icon
                  className={`w-4 h-4 flex-shrink-0 transition-transform ${
                    isActive ? 'text-white' : item.destructive ? 'text-red-400' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />

                {!collapsed && (
                  <div className="flex items-center justify-between flex-1 truncate">
                    <span className="truncate">{item.label}</span>
                    <div className="flex items-center gap-1.5 ml-2">
                      {item.badge !== undefined && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                            isActive ? 'bg-blue-700 text-blue-100' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      {item.shortcut && (
                        <span
                          className={`text-[9px] font-mono opacity-60 ${
                            isActive ? 'text-blue-100' : 'text-slate-400'
                          }`}
                        >
                          {item.shortcut}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer info */}
      <div className="p-3 border-t border-slate-800/80 text-[11px] text-slate-400">
        {!collapsed ? (
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-slate-300">VolumnBook System</span>
            <span className="text-[10px] text-slate-400 font-mono">SQLite Local DB Engine</span>
          </div>
        ) : (
          <div className="flex justify-center" title="VolumnBook v1.0.0">
            <span className="text-[10px] font-mono text-slate-400">v1.0</span>
          </div>
        )}
      </div>
    </aside>
  );
};
