/**
 * VolumnBook — About Information Module
 * Displays system architecture, technology stack, offline status, and licensing.
 */

import React from 'react';
import { Info, BookOpen, ShieldCheck, CheckCircle2, HardDrive, Cpu, Terminal } from 'lucide-react';

export const AboutView: React.FC = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          About VolumnBook
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Case & Judgement Volume Management System — Production Offline Desktop Edition.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800/90 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs p-6 space-y-6">
        {/* App Branding Banner */}
        <div className="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="w-14 h-14 rounded-xl bg-blue-900 text-white flex items-center justify-center shadow-md">
            <BookOpen className="w-8 h-8 text-blue-300" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
              VolumnBook
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Case & Judgement Volume Management System
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 rounded">
                Version 1.0.0
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% Offline Capable
              </span>
            </div>
          </div>
        </div>

        {/* Technology Architecture Grid */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
            Core Technology Architecture
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 text-[10px] block font-semibold uppercase">Desktop Runtime</span>
              <strong className="text-slate-800 dark:text-slate-200 font-mono text-xs">Electron 33+</strong>
              <p className="text-[10px] text-slate-500 mt-1">Native Windows window & lifecycle</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 text-[10px] block font-semibold uppercase">Database Engine</span>
              <strong className="text-slate-800 dark:text-slate-200 font-mono text-xs">SQLite 3</strong>
              <p className="text-[10px] text-slate-500 mt-1">Embedded, zero server overhead</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 text-[10px] block font-semibold uppercase">Frontend Core</span>
              <strong className="text-slate-800 dark:text-slate-200 font-mono text-xs">React 19 + TypeScript</strong>
              <p className="text-[10px] text-slate-500 mt-1">High-performance reactive interface</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 text-[10px] block font-semibold uppercase">Packaging Target</span>
              <strong className="text-slate-800 dark:text-slate-200 font-mono text-xs">NSIS Installer + Portable</strong>
              <p className="text-[10px] text-slate-500 mt-1">Independent Windows standalone</p>
            </div>
          </div>
        </div>

        {/* Security & Isolation Standards */}
        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Security & IPC Isolation Enforcement
          </h3>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
            VolumnBook conforms to strict Electron desktop security guidelines:
            <code className="text-blue-600 dark:text-blue-400 mx-1">contextIsolation: true</code>,
            <code className="text-blue-600 dark:text-blue-400 mx-1">nodeIntegration: false</code>, and a restricted
            preload API bridge. Database queries utilize parameterized statements to preclude SQL injection, and zero external CDNs or APIs are queried.
          </p>
        </div>

        {/* Legal & Storage Notice */}
        <div className="pt-2 text-xs text-slate-500 dark:text-slate-400 space-y-1 border-t border-slate-100 dark:border-slate-800">
          <div className="flex justify-between">
            <span>License: Enterprise Office Desktop License</span>
            <span>Copyright © 2026 VolumnBook. All rights reserved.</span>
          </div>
          <div>Target Operating Environment: Microsoft Windows 10/11 64-bit.</div>
        </div>
      </div>
    </div>
  );
};
