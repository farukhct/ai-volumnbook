/**
 * VolumnBook — Ultra User-Friendly Edit Record Modal
 * Designed for legal clerks and volume administrators:
 * - Visual judicial pipeline stage progress tracker
 * - Fast 1-click stage advancement (e.g. "Mark Dispatched Today")
 * - Smart chronology validation with real-time feedback
 * - Quick-insert legal remarks presets
 * - Change detection with 1-click "Revert Changes"
 * - Keyboard shortcuts (Ctrl+S to save, Esc to close)
 * - Built-in quick print and safe delete actions
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  RotateCcw,
  Printer,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Calendar,
  Send,
  FileCheck,
  FileText,
  Gavel,
  History,
  Check,
} from 'lucide-react';
import { VolumeRecord } from '../types';
import { DatePickerInput } from './DatePickerInput';
import { validateDateSequence, getTodayDbDate, formatToDisplayDate } from '../lib/dateUtils';
import { useToast } from './Toast';

interface EditRecordModalProps {
  record: VolumeRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: number, updates: Partial<VolumeRecord>) => Promise<void>;
  onDeleteRequest?: (record: VolumeRecord) => void;
  onPrintRequest?: (record: VolumeRecord) => void;
}

const COMMON_REMARKS_PRESETS = [
  'Judgement delivered in open court',
  'Decree drawn & sealed',
  'Transmitted to administrative section',
  'Awaiting final signature of presiding judge',
  'Certified copy ready for delivery',
  'Disposed of with compliance report',
  'Record consigned to record room',
];

export const EditRecordModal: React.FC<EditRecordModalProps> = ({
  record,
  isOpen,
  onClose,
  onSave,
  onDeleteRequest,
  onPrintRequest,
}) => {
  const { showToast } = useToast();

  // Form State
  const [caseNo, setCaseNo] = useState<string>('');
  const [judgementDate, setJudgementDate] = useState<string | null>(null);
  const [draftDate, setDraftDate] = useState<string | null>(null);
  const [finalDate, setFinalDate] = useState<string | null>(null);
  const [sendToSectionDate, setSendToSectionDate] = useState<string | null>(null);
  const [remarks, setRemarks] = useState<string>('');

  const [warnings, setWarnings] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Initialize form when record changes
  useEffect(() => {
    if (record) {
      setCaseNo(record.CaseNo || '');
      setJudgementDate(record.JudgementDate || null);
      setDraftDate(record.DraftDate || null);
      setFinalDate(record.FinalDate || null);
      setSendToSectionDate(record.SendToSectionDate || null);
      setRemarks(record.Remarks || '');
    }
  }, [record]);

  // Chronology validation
  useEffect(() => {
    if (isOpen) {
      const res = validateDateSequence({
        judgementDate,
        draftDate,
        finalDate,
        sendToSectionDate,
      });
      setWarnings(res.warnings);
    }
  }, [judgementDate, draftDate, finalDate, sendToSectionDate, isOpen]);

  // Detect if user modified any field
  const hasChanges = React.useMemo(() => {
    if (!record) return false;
    return (
      caseNo !== record.CaseNo ||
      (judgementDate || null) !== (record.JudgementDate || null) ||
      (draftDate || null) !== (record.DraftDate || null) ||
      (finalDate || null) !== (record.FinalDate || null) ||
      (sendToSectionDate || null) !== (record.SendToSectionDate || null) ||
      remarks !== (record.Remarks || '')
    );
  }, [record, caseNo, judgementDate, draftDate, finalDate, sendToSectionDate, remarks]);

  // Current Case Stage Classification
  const currentStage = React.useMemo(() => {
    if (sendToSectionDate) {
      return {
        label: 'Completed & Transmitted',
        color: 'text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800',
        step: 4,
      };
    }
    if (finalDate) {
      return {
        label: 'Awaiting Section Transmission',
        color: 'text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800',
        step: 3,
      };
    }
    if (draftDate) {
      return {
        label: 'Draft Order Phase',
        color: 'text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800',
        step: 2,
      };
    }
    if (judgementDate) {
      return {
        label: 'Judgement Delivered',
        color: 'text-indigo-700 bg-indigo-100 dark:text-indigo-300 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800',
        step: 1,
      };
    }
    return {
      label: 'Initial Entry (Pending Judgement)',
      color: 'text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-800 border-slate-300 dark:border-slate-700',
      step: 0,
    };
  }, [judgementDate, draftDate, finalDate, sendToSectionDate]);

  // Revert changes
  const handleRevert = () => {
    if (!record) return;
    setCaseNo(record.CaseNo || '');
    setJudgementDate(record.JudgementDate || null);
    setDraftDate(record.DraftDate || null);
    setFinalDate(record.FinalDate || null);
    setSendToSectionDate(record.SendToSectionDate || null);
    setRemarks(record.Remarks || '');
    showToast('Changes reverted to original record values.', 'info');
  };

  // Quick Action: Mark Dispatched Today
  const handleMarkDispatchedToday = () => {
    const today = getTodayDbDate();
    setSendToSectionDate(today);
    if (!finalDate) setFinalDate(today);
    if (!draftDate) setDraftDate(today);
    if (!judgementDate) setJudgementDate(today);
    showToast('Marked as dispatched to section today.', 'success');
  };

  // Quick Action: Add preset remark
  const handleAddPresetRemark = (presetText: string) => {
    setRemarks((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return presetText;
      if (trimmed.includes(presetText)) return prev;
      return `${trimmed}; ${presetText}`;
    });
  };

  // Save handler
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!record) return;

    if (!caseNo.trim()) {
      showToast('Case No cannot be empty.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(record.Id, {
        CaseNo: caseNo.trim(),
        JudgementDate: judgementDate,
        DraftDate: draftDate,
        FinalDate: finalDate,
        SendToSectionDate: sendToSectionDate,
        Remarks: remarks.trim() || null,
      });
      showToast(`Record #${record.SerialNo} (${caseNo.trim()}) updated successfully.`, 'success');
      onClose();
    } catch (err: any) {
      showToast(err?.message || 'Failed to update record.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Keyboard shortcut Ctrl+S and Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, caseNo, judgementDate, draftDate, finalDate, sendToSectionDate, remarks, record]);

  if (!isOpen || !record) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/65 backdrop-blur-xs select-text overflow-y-auto">
      <div
        className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 my-auto overflow-visible flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
              <Gavel className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Edit Volume Record
                </h3>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                  Serial #{record.SerialNo}
                </span>
                {hasChanges && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse">
                    Unsaved Changes
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Official Volume Book Registry • Id: {record.Id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onPrintRequest && (
              <button
                type="button"
                onClick={() => onPrintRequest(record)}
                className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors"
                title="Print this record"
              >
                <Printer className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Workflow Stage Progress Banner */}
        <div className="px-6 py-3 bg-slate-100/70 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Case Stage Pipeline
            </span>
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${currentStage.color}`}
            >
              {currentStage.label}
            </span>
          </div>

          {/* 4 Steps Indicator */}
          <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
            {/* Step 1: Judgement */}
            <div
              className={`p-1.5 rounded-md border flex items-center justify-center gap-1.5 transition-all ${
                judgementDate
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-medium'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'
              }`}
            >
              <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] bg-emerald-600 text-white">
                {judgementDate ? <Check className="w-2.5 h-2.5" /> : '1'}
              </span>
              <span className="truncate">1. Judgement</span>
            </div>

            {/* Step 2: Draft */}
            <div
              className={`p-1.5 rounded-md border flex items-center justify-center gap-1.5 transition-all ${
                draftDate
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-medium'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'
              }`}
            >
              <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] bg-emerald-600 text-white">
                {draftDate ? <Check className="w-2.5 h-2.5" /> : '2'}
              </span>
              <span className="truncate">2. Draft</span>
            </div>

            {/* Step 3: Final */}
            <div
              className={`p-1.5 rounded-md border flex items-center justify-center gap-1.5 transition-all ${
                finalDate
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-medium'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'
              }`}
            >
              <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] bg-emerald-600 text-white">
                {finalDate ? <Check className="w-2.5 h-2.5" /> : '3'}
              </span>
              <span className="truncate">3. Final</span>
            </div>

            {/* Step 4: Dispatched */}
            <div
              className={`p-1.5 rounded-md border flex items-center justify-center gap-1.5 transition-all ${
                sendToSectionDate
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-medium'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'
              }`}
            >
              <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] bg-emerald-600 text-white">
                {sendToSectionDate ? <Check className="w-2.5 h-2.5" /> : '4'}
              </span>
              <span className="truncate">4. Section</span>
            </div>
          </div>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSave} className="p-6 space-y-5 overflow-visible">
          {/* Section 1: Identification */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Serial No Display */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1">
                Serial No
              </label>
              <div className="flex items-center px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-600 dark:text-slate-400 font-mono text-xs font-bold">
                <span>#{record.SerialNo}</span>
                <span className="text-[10px] text-slate-400 font-normal ml-auto">(Permanent)</span>
              </div>
            </div>

            {/* Case No Input */}
            <div className="sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1">
                Case No <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={caseNo}
                  onChange={(e) => setCaseNo(e.target.value)}
                  placeholder="e.g. WP/1042/2024, CRL.A/509/2023"
                  className={`w-full px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-800 border rounded-md text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                    !caseNo.trim()
                      ? 'border-red-400 dark:border-red-600'
                      : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
                {caseNo && (
                  <button
                    type="button"
                    onClick={() => setCaseNo('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title="Clear Case No"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Chronological Judicial Dates */}
          <div className="p-4 bg-slate-50 dark:bg-slate-850/80 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  <span>Judicial Timeline Dates</span>
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  Format: <strong>dd-MM-yyyy</strong> • Select dates via interactive calendar or typing
                </span>
              </div>

              {/* Quick Action: Mark Dispatched Today */}
              <button
                type="button"
                onClick={handleMarkDispatchedToday}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/60 hover:bg-emerald-200 border border-emerald-300 dark:border-emerald-800 rounded transition-colors self-start sm:self-auto cursor-pointer"
                title="Automatically sets Send to Section Date to Today"
              >
                <Send className="w-3 h-3" />
                <span>Mark Dispatched Today</span>
              </button>
            </div>

            {/* Date Pickers Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              <DatePickerInput
                id="edit-judgement-date"
                label="1. Judgement Date"
                value={judgementDate}
                onChange={setJudgementDate}
                align="left"
              />

              <DatePickerInput
                id="edit-draft-date"
                label="2. Draft Date"
                value={draftDate}
                onChange={setDraftDate}
                align="left"
              />

              <DatePickerInput
                id="edit-final-date"
                label="3. Final Date"
                value={finalDate}
                onChange={setFinalDate}
                align="right"
              />

              <DatePickerInput
                id="edit-send-to-section-date"
                label="4. Send To Section"
                value={sendToSectionDate}
                onChange={setSendToSectionDate}
                align="right"
              />
            </div>

            {/* Warnings Alert */}
            {warnings.length > 0 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-md text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Chronological Date Notice:</span>
                  <ul className="list-disc list-inside mt-0.5 space-y-0.5 text-[11px]">
                    {warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Remarks & Quick Legal Presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <span>Remarks / Court Notes</span>
                <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
              </label>
              <span className="text-[10px] text-slate-400">
                {remarks.length} character{remarks.length === 1 ? '' : 's'}
              </span>
            </div>

            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter special orders, compliance details, bench directions, or archival notes..."
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                    onClick={() => handleAddPresetRemark(preset)}
                    className="px-2 py-0.5 text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-300 border border-slate-200 dark:border-slate-700 rounded transition-colors"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 4: Audit Metadata */}
          <div className="pt-2 text-[10px] text-slate-400 border-t border-slate-200 dark:border-slate-800 flex flex-wrap justify-between gap-2">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Created: {new Date(record.CreatedAt).toLocaleString()}</span>
            </span>
            {record.UpdatedAt && (
              <span className="flex items-center gap-1">
                <History className="w-3 h-3" />
                <span>Last Updated: {new Date(record.UpdatedAt).toLocaleString()}</span>
              </span>
            )}
          </div>

          {/* Bottom Action Footer */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Left side actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {onDeleteRequest && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onDeleteRequest(record);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors"
                  title="Delete this record"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Record</span>
                </button>
              )}

              {hasChanges && (
                <button
                  type="button"
                  onClick={handleRevert}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                  title="Revert to original values"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Revert</span>
                </button>
              )}
            </div>

            {/* Right side primary controls */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSaving || !caseNo.trim()}
                className={`flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer ${
                  isSaving || !caseNo.trim()
                    ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white'
                }`}
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save Changes (Ctrl+S)'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
