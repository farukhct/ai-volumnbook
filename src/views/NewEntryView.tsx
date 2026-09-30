/**
 * VolumnBook — New Data Entry Form
 * Professional data entry with auto-generated Serial No, strict dd-MM-yyyy dates,
 * logical sequence verification, and keyboard shortcuts (Ctrl+S).
 */

import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  RotateCcw,
  Save,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Calendar,
  Send,
  X,
} from 'lucide-react';
import { DatePickerInput } from '../components/DatePickerInput';
import { db } from '../lib/database';
import { validateDateSequence, getTodayDbDate } from '../lib/dateUtils';
import { useToast } from '../components/Toast';
import { VolumeRecordInput, NavigationModule } from '../types';

const COMMON_REMARKS_PRESETS = [
  'Judgement delivered in open court',
  'Decree drawn & sealed',
  'Transmitted to administrative section',
  'Awaiting final signature of presiding judge',
  'Certified copy ready for delivery',
  'Disposed of with compliance report',
  'Record consigned to record room',
];

interface NewEntryViewProps {
  onNavigate: (module: NavigationModule) => void;
  onRecordSaved?: () => void;
}

export const NewEntryView: React.FC<NewEntryViewProps> = ({ onNavigate, onRecordSaved }) => {
  const { showToast } = useToast();
  const [nextSerialNo, setNextSerialNo] = useState<number>(1);
  const [caseNo, setCaseNo] = useState<string>('');
  const [judgementDate, setJudgementDate] = useState<string | null>(null);
  const [draftDate, setDraftDate] = useState<string | null>(null);
  const [finalDate, setFinalDate] = useState<string | null>(null);
  const [sendToSectionDate, setSendToSectionDate] = useState<string | null>(null);
  const [remarks, setRemarks] = useState<string>('');

  const [dateWarnings, setDateWarnings] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [lastSavedSerial, setLastSavedSerial] = useState<number | null>(null);

  const fetchNextSerial = () => {
    const next = db.getNextSerialNo();
    setNextSerialNo(next);
  };

  useEffect(() => {
    fetchNextSerial();
  }, []);

  // Validate date logic
  useEffect(() => {
    const result = validateDateSequence({
      judgementDate,
      draftDate,
      finalDate,
      sendToSectionDate,
    });
    setDateWarnings(result.warnings);
  }, [judgementDate, draftDate, finalDate, sendToSectionDate]);

  // Keyboard shortcut Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [caseNo, judgementDate, draftDate, finalDate, sendToSectionDate, remarks]);

  const handleResetForm = () => {
    setCaseNo('');
    setJudgementDate(null);
    setDraftDate(null);
    setFinalDate(null);
    setSendToSectionDate(null);
    setRemarks('');
    setDateWarnings([]);
    fetchNextSerial();
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!caseNo || caseNo.trim() === '') {
      showToast('Please enter a Case No.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const input: VolumeRecordInput = {
        CaseNo: caseNo.trim(),
        JudgementDate: judgementDate,
        DraftDate: draftDate,
        FinalDate: finalDate,
        SendToSectionDate: sendToSectionDate,
        Remarks: remarks.trim() ? remarks.trim() : null,
      };

      const saved = await db.addRecord(input);
      showToast(`Record saved successfully. Serial No: ${saved.SerialNo}`, 'success');
      setLastSavedSerial(saved.SerialNo);
      handleResetForm();
      if (onRecordSaved) onRecordSaved();
    } catch (err: any) {
      showToast(err?.message || 'Failed to save record.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            New Volume Record Entry
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Add a new case record to the volume register. Serial No is automatically generated.
          </p>
        </div>

        <button
          onClick={() => onNavigate('all-records')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All Records</span>
        </button>
      </div>

      {/* Success Callout if just saved */}
      {lastSavedSerial && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-md flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>
              Record with <strong>Serial No {lastSavedSerial}</strong> was saved successfully to SQLite database.
            </span>
          </div>
          <button
            onClick={() => onNavigate('all-records')}
            className="underline font-semibold hover:text-emerald-700"
          >
            View in All Records
          </button>
        </div>
      )}

      {/* Main Entry Form Card */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800/90 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs overflow-visible">
        {/* Form Header */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Case Volume Information
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">Assigned Serial No:</span>
            <span className="px-2.5 py-0.5 bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 font-mono font-bold text-xs rounded">
              #{nextSerialNo}
            </span>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Row 1: Serial No (Disabled display) & Case No (Required) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between mb-1">
                <span>SERIAL NO</span>
                <span className="text-[10px] text-slate-400 font-normal">Auto-generated</span>
              </label>
              <input
                type="text"
                disabled
                value={`# ${nextSerialNo} (Automatic)`}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md font-mono text-slate-500 dark:text-slate-400 cursor-not-allowed"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="caseNo" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between mb-1">
                <span>
                  CASE NO <span className="text-red-500">*</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Official Identifier</span>
              </label>
              <div className="relative">
                <input
                  id="caseNo"
                  type="text"
                  required
                  value={caseNo}
                  onChange={(e) => setCaseNo(e.target.value)}
                  placeholder="e.g. WP/2026/1042 or CR-982/2026"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-500 font-medium"
                />
                {caseNo && (
                  <button
                    type="button"
                    onClick={() => setCaseNo('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title="Clear Case No"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Row 2: Four Sequential Dates Header with Quick Action */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                <span>Judicial Timeline Dates</span>
              </span>

              <button
                type="button"
                onClick={() => {
                  const today = getTodayDbDate();
                  setSendToSectionDate(today);
                  if (!finalDate) setFinalDate(today);
                  if (!draftDate) setDraftDate(today);
                  if (!judgementDate) setJudgementDate(today);
                  showToast('Marked as dispatched to section today.', 'success');
                }}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/60 hover:bg-emerald-200 border border-emerald-300 dark:border-emerald-800 rounded transition-colors cursor-pointer"
                title="Automatically sets Send to Section Date to Today"
              >
                <Send className="w-3 h-3" />
                <span>Mark Dispatched Today</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <DatePickerInput
                id="judgementDate"
                label="1. JUDGEMENT DATE"
                value={judgementDate}
                onChange={setJudgementDate}
              />

              <DatePickerInput
                id="draftDate"
                label="2. DRAFT DATE"
                value={draftDate}
                onChange={setDraftDate}
              />

              <DatePickerInput
                id="finalDate"
                label="3. FINAL DATE"
                value={finalDate}
                onChange={setFinalDate}
                align="right"
              />

              <DatePickerInput
                id="sendToSectionDate"
                label="4. SEND TO SECTION DATE"
                value={sendToSectionDate}
                onChange={setSendToSectionDate}
                align="right"
              />
            </div>
          </div>

          {/* Date Sequence Warnings */}
          {dateWarnings.length > 0 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-md text-xs text-amber-800 dark:text-amber-300 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <span>Notice on Chronological Sequence:</span>
              </div>
              <ul className="list-disc list-inside pl-1 text-[11px] space-y-0.5">
                {dateWarnings.map((warn, i) => (
                  <li key={i}>{warn}</li>
                ))}
              </ul>
              <span className="text-[10px] text-amber-700/80 dark:text-amber-400 block pt-1">
                (You may still proceed if this reflects exceptional administrative circumstances.)
              </span>
            </div>
          )}

          {/* Row 3: Remarks (Optional) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="remarks" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>REMARKS</span>
                <span className="text-[10px] text-slate-400 font-normal ml-2">Optional</span>
              </label>
              <span className="text-[10px] text-slate-400">
                {remarks.length} character{remarks.length === 1 ? '' : 's'}
              </span>
            </div>

            <textarea
              id="remarks"
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter any additional court volume remarks, bench information, or notes..."
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-500"
            />

            {/* Clickable Quick Presets */}
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Quick-insert preset notes:</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_REMARKS_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setRemarks((prev) => {
                        const trimmed = prev.trim();
                        if (!trimmed) return preset;
                        if (trimmed.includes(preset)) return prev;
                        return `${trimmed}; ${preset}`;
                      });
                    }}
                    className="px-2 py-0.5 text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-300 border border-slate-200 dark:border-slate-700 rounded transition-colors"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Press <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono text-[10px]">Ctrl+S</kbd> to save immediately
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetForm}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 rounded-md shadow-xs transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Saving...' : 'Save Record'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
