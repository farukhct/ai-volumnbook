/**
 * VolumnBook — Animated Working & Processing Modal
 * Displayed during long-running background tasks (CSV Import, Backup, Restore, Export, Clean, Search).
 * Provides dynamic dual-ring spinning animations, smooth progress tracking, step visualization,
 * and clear real-time status feedback.
 */

import React, { useEffect, useState } from 'react';
import {
  Database,
  FileSpreadsheet,
  HardDrive,
  RotateCcw,
  Download,
  Trash2,
  FileText,
  CheckCircle2,
  Loader2,
  Activity,
  Layers,
  Sparkles,
  Check,
} from 'lucide-react';

export type WorkingIconType = 'import' | 'backup' | 'restore' | 'export' | 'clean' | 'database' | 'search' | 'save';

export interface WorkingModalProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  iconType?: WorkingIconType;
  steps?: string[];
  currentStepIndex?: number;
  progressPercent?: number; // 0 to 100, undefined for indeterminate
  statusMessage?: string;
  details?: string;
}

export const WorkingModal: React.FC<WorkingModalProps> = ({
  isOpen,
  title,
  subtitle = 'Please wait while VolumnBook processes your request...',
  iconType = 'database',
  steps,
  currentStepIndex = 0,
  progressPercent,
  statusMessage,
  details,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Timer for elapsed time while active
  useEffect(() => {
    if (!isOpen) {
      setElapsedSeconds(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const formatElapsed = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getIcon = () => {
    switch (iconType) {
      case 'import':
        return <FileSpreadsheet className="w-8 h-8 text-blue-500 animate-pulse" />;
      case 'backup':
        return <Download className="w-8 h-8 text-emerald-500 animate-pulse" />;
      case 'restore':
        return <RotateCcw className="w-8 h-8 text-indigo-500 animate-pulse" />;
      case 'export':
        return <FileText className="w-8 h-8 text-blue-500 animate-pulse" />;
      case 'clean':
        return <Trash2 className="w-8 h-8 text-red-500 animate-pulse" />;
      case 'search':
        return <Activity className="w-8 h-8 text-indigo-500 animate-pulse" />;
      case 'save':
        return <Layers className="w-8 h-8 text-emerald-500 animate-pulse" />;
      case 'database':
      default:
        return <Database className="w-8 h-8 text-blue-500 animate-pulse" />;
    }
  };

  const getAccentColors = () => {
    switch (iconType) {
      case 'clean':
        return {
          ring: 'border-red-500',
          glow: 'from-red-500 to-orange-500',
          bg: 'bg-red-500',
          badge: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
        };
      case 'backup':
        return {
          ring: 'border-emerald-500',
          glow: 'from-emerald-500 to-teal-500',
          bg: 'bg-emerald-500',
          badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        };
      case 'restore':
        return {
          ring: 'border-indigo-500',
          glow: 'from-indigo-500 to-purple-500',
          bg: 'bg-indigo-500',
          badge: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
        };
      default:
        return {
          ring: 'border-blue-500',
          glow: 'from-blue-500 to-indigo-500',
          bg: 'bg-blue-600',
          badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        };
    }
  };

  const accents = getAccentColors();

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 select-none"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform animate-in zoom-in-95 duration-200">
        {/* Top Animated Moving Ambient Glow Bar */}
        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
          <div
            className={`absolute inset-0 bg-gradient-to-r ${accents.glow} animate-[shimmer_2s_infinite]`}
            style={{ width: '40%' }}
          />
        </div>

        <div className="p-6 space-y-6">
          {/* Central Animated Illustration / Dual Concentric Rings */}
          <div className="flex flex-col items-center justify-center pt-2">
            <div className="relative flex items-center justify-center w-24 h-24 mb-3">
              {/* Outer pulsing radar ring */}
              <div
                className={`absolute inset-0 rounded-full border-2 ${accents.ring} opacity-25 animate-ping`}
              />

              {/* Outer spinning ring (clockwise) */}
              <div
                className={`absolute inset-0 rounded-full border-2 border-dashed ${accents.ring} animate-spin`}
                style={{ animationDuration: '6s' }}
              />

              {/* Inner spinning ring (counter-clockwise) */}
              <div
                className="absolute inset-2 rounded-full border-2 border-slate-300 dark:border-slate-700 border-t-transparent border-b-transparent animate-[spin-reverse_3s_linear_infinite]"
              />

              {/* Center icon background disc */}
              <div className="relative z-10 w-14 h-14 rounded-full bg-slate-50 dark:bg-slate-800 shadow-inner flex items-center justify-center border border-slate-200 dark:border-slate-700">
                {getIcon()}
              </div>

              {/* Tiny orbiting sparkle / activity pip */}
              <div className="absolute top-0 right-1 w-3 h-3 rounded-full bg-blue-500 dark:bg-blue-400 shadow-md animate-pulse" />
            </div>

            {/* Title & Subtitle */}
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 text-center tracking-tight">
              {title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-1 max-w-sm">
              {subtitle}
            </p>
          </div>

          {/* Progress Bar (Determinate or Indeterminate) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="flex items-center gap-1.5 font-sans font-medium text-slate-600 dark:text-slate-300">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                <span>{statusMessage || 'Processing legal volume database...'}</span>
              </span>
              <span className="text-slate-400 font-mono">
                {progressPercent !== undefined ? `${Math.round(progressPercent)}%` : formatElapsed(elapsedSeconds)}
              </span>
            </div>

            <div className="relative h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-750">
              {progressPercent !== undefined ? (
                <div
                  className={`h-full bg-gradient-to-r ${accents.glow} rounded-full transition-all duration-300 relative overflow-hidden`}
                  style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                >
                  {/* Internal shimmer wave across the progress bar */}
                  <div className="absolute inset-0 bg-white/20 animate-[shimmer_1.5s_infinite]" />
                </div>
              ) : (
                /* Indeterminate animated gradient beam */
                <div className="h-full w-full relative">
                  <div
                    className={`absolute inset-y-0 bg-gradient-to-r ${accents.glow} rounded-full animate-[shimmer_1.8s_ease-in-out_infinite]`}
                    style={{ width: '50%' }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Multi-step list (if steps provided) */}
          {steps && steps.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-850/70 rounded-lg p-3.5 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Workflow Progress ({Math.min(currentStepIndex + 1, steps.length)} of {steps.length})
              </div>
              <div className="space-y-1.5">
                {steps.map((step, idx) => {
                  const isDone = idx < currentStepIndex;
                  const isCurrent = idx === currentStepIndex;
                  return (
                    <div
                      key={step}
                      className={`flex items-center gap-2.5 text-xs transition-colors ${
                        isDone
                          ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                          : isCurrent
                          ? 'text-slate-900 dark:text-slate-100 font-semibold'
                          : 'text-slate-400 dark:text-slate-600'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {isDone ? (
                          <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        ) : isCurrent ? (
                          <div className="w-4 h-4 rounded-full bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center text-[9px] font-mono">
                            {idx + 1}
                          </div>
                        )}
                      </div>
                      <span className="truncate">{step}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Details / Notice */}
          {details && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center bg-slate-50 dark:bg-slate-800/50 p-2 rounded border border-slate-200 dark:border-slate-800">
              {details}
            </p>
          )}

          {/* Footer Activity Ticker */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="font-sans">Engine: SQLite Local File</span>
            </div>
            <div className="font-mono text-[10px]">
              Elapsed: {formatElapsed(elapsedSeconds)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
