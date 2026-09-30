/**
 * VolumnBook — Main Desktop Application Root
 * Case & Judgement Volume Management System
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { StatusBar } from './components/StatusBar';
import { ToastProvider } from './components/Toast';
import { NavigationModule, VolumeRecord } from './types';
import { db } from './lib/database';

// Views
import { DashboardView } from './views/DashboardView';
import { NewEntryView } from './views/NewEntryView';
import { AllRecordsView } from './views/AllRecordsView';
import { SearchView } from './views/SearchView';
import { ReportsView } from './views/ReportsView';
import { PrintView } from './views/PrintView';
import { ExportView } from './views/ExportView';
import { ImportView } from './views/ImportView';
import { BackupView } from './views/BackupView';
import { RestoreView } from './views/RestoreView';
import { CleanDatabaseView } from './views/CleanDatabaseView';
import { SettingsView } from './views/SettingsView';
import { AboutView } from './views/AboutView';

export default function App() {
  const [currentModule, setCurrentModule] = useState<NavigationModule>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [totalRecordsCount, setTotalRecordsCount] = useState<number>(0);
  const [lastActionMessage, setLastActionMessage] = useState<string>('Ready');

  // Print Job State for transferring filtered sets to PrintView
  const [printJob, setPrintJob] = useState<{
    records: VolumeRecord[];
    title: string;
    filterDescription?: string;
  } | null>(null);

  const applyTheme = useCallback((targetTheme: 'light' | 'dark') => {
    const isDark = targetTheme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    document.body.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  }, []);

  // Initialize Theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('volumnbook_theme') as 'light' | 'dark' | null;
    const initialTheme = savedTheme === 'dark' ? 'dark' : 'light';
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, [applyTheme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('volumnbook_theme', nextTheme);
    applyTheme(nextTheme);
    setLastActionMessage(`Switched to ${nextTheme} theme`);
  };

  // Refresh record count
  const refreshStats = useCallback(async () => {
    try {
      const records = await db.getRecords();
      setTotalRecordsCount(records.length);
    } catch {
      setTotalRecordsCount(0);
    }
  }, []);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in input or textarea unless it's a navigational shortcut
      const isInput =
        e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'n':
            e.preventDefault();
            setCurrentModule('new-entry');
            setLastActionMessage('Navigated to New Entry');
            break;
          case 'f':
            if (!isInput) {
              e.preventDefault();
              setCurrentModule('search');
              setLastActionMessage('Navigated to Search');
            }
            break;
          case 'p':
            e.preventDefault();
            setCurrentModule('print');
            setLastActionMessage('Navigated to Print View');
            break;
          case 'b':
            e.preventDefault();
            setCurrentModule('backup');
            setLastActionMessage('Navigated to Backup');
            break;
          case 'e':
            if (!isInput) {
              e.preventDefault();
              setCurrentModule('export');
              setLastActionMessage('Navigated to Export');
            }
            break;
          case 'i':
            if (!isInput) {
              e.preventDefault();
              setCurrentModule('import');
              setLastActionMessage('Navigated to CSV Import');
            }
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleNavigate = (module: NavigationModule) => {
    setCurrentModule(module);
    setLastActionMessage(`Switched to ${module}`);
  };

  const handleTriggerPrint = (records: VolumeRecord[], title: string, filterDesc?: string) => {
    setPrintJob({ records, title, filterDescription: filterDesc });
    setCurrentModule('print');
  };

  return (
    <ToastProvider>
      <div className={`h-screen w-screen flex flex-col bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden font-sans select-none ${theme === 'dark' ? 'dark' : ''}`}>
        {/* Top Windows Native Titlebar & Action Header */}
        <Header
          currentModule={currentModule}
          onNavigate={handleNavigate}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          theme={theme}
          onToggleTheme={toggleTheme}
          totalRecordsCount={totalRecordsCount}
        />

        {/* Main Work Area: Sidebar + Scrollable View Container */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Navigation Sidebar */}
          <Sidebar
            currentModule={currentModule}
            onNavigate={handleNavigate}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            totalRecordsCount={totalRecordsCount}
          />

          {/* Active View Container */}
          <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-925 select-text custom-scrollbar">
            {currentModule === 'dashboard' && (
              <DashboardView onNavigate={handleNavigate} />
            )}

            {currentModule === 'new-entry' && (
              <NewEntryView
                onNavigate={handleNavigate}
                onRecordSaved={() => {
                  refreshStats();
                  setLastActionMessage('Record added successfully');
                }}
              />
            )}

            {currentModule === 'all-records' && (
              <AllRecordsView
                onNavigate={handleNavigate}
                onPrintRecords={handleTriggerPrint}
              />
            )}

            {currentModule === 'search' && (
              <SearchView
                onNavigate={handleNavigate}
                onPrintRecords={handleTriggerPrint}
              />
            )}

            {currentModule === 'reports' && (
              <ReportsView
                onNavigate={handleNavigate}
                onPrintReport={handleTriggerPrint}
              />
            )}

            {currentModule === 'print' && (
              <PrintView
                onNavigate={handleNavigate}
                preselectedRecords={printJob?.records}
                reportTitle={printJob?.title}
                filterDescription={printJob?.filterDescription}
              />
            )}

            {currentModule === 'export' && (
              <ExportView onNavigate={handleNavigate} />
            )}

            {currentModule === 'import' && (
              <ImportView
                onNavigate={handleNavigate}
                onImportComplete={() => {
                  refreshStats();
                  setLastActionMessage('CSV Data imported successfully');
                }}
              />
            )}

            {currentModule === 'backup' && <BackupView />}

            {currentModule === 'restore' && (
              <RestoreView
                onNavigate={handleNavigate}
                onRestoreComplete={() => {
                  refreshStats();
                  setLastActionMessage('Database restored from backup');
                }}
              />
            )}

            {currentModule === 'clean' && (
              <CleanDatabaseView
                onNavigate={handleNavigate}
                onCleanComplete={() => {
                  refreshStats();
                  setLastActionMessage('Database purged (Total: 0)');
                }}
              />
            )}

            {currentModule === 'settings' && (
              <SettingsView theme={theme} onToggleTheme={toggleTheme} />
            )}

            {currentModule === 'about' && <AboutView />}
          </main>
        </div>

        {/* Windows Bottom Status Bar */}
        <StatusBar
          totalRecordsCount={totalRecordsCount}
          currentModule={currentModule}
          lastActionMessage={lastActionMessage}
        />
      </div>
    </ToastProvider>
  );
}
