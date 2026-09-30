/**
 * VolumnBook — Interactive Date Picker & Calendar Popover
 * Strictly maintains dd-MM-yyyy display while synchronizing ISO YYYY-MM-DD for storage.
 * Includes interactive calendar popover, quick month/year navigation, today jump, and clear.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  RotateCcw,
} from 'lucide-react';
import {
  formatToDisplayDate,
  parseToDbDate,
  isValidDisplayDate,
  getTodayDisplayDate,
  getTodayDbDate,
} from '../lib/dateUtils';

interface DatePickerInputProps {
  id?: string;
  label?: string;
  value: string | null; // ISO YYYY-MM-DD format or null
  onChange: (dbDate: string | null) => void;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  align?: 'left' | 'right';
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export const DatePickerInput: React.FC<DatePickerInputProps> = ({
  id,
  label,
  value,
  onChange,
  required = false,
  placeholder = 'dd-MM-yyyy',
  disabled = false,
  className = '',
  align = 'left',
}) => {
  const [displayText, setDisplayText] = useState<string>('');
  const [isInvalid, setIsInvalid] = useState<boolean>(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);

  // Calendar navigation state (year & month 0-indexed)
  const today = new Date();
  const [viewYear, setViewYear] = useState<number>(today.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(today.getMonth());
  const [effectiveAlign, setEffectiveAlign] = useState<'left' | 'right'>(align);

  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-detect popover boundary so calendar never clips outside right edge
  useEffect(() => {
    if (isCalendarOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.left + 295 > window.innerWidth || align === 'right') {
        setEffectiveAlign('right');
      } else {
        setEffectiveAlign('left');
      }
    }
  }, [isCalendarOpen, align]);

  // Sync internal YYYY-MM-DD value to user display format
  useEffect(() => {
    if (value) {
      setDisplayText(formatToDisplayDate(value));
      setIsInvalid(false);
      // Also update calendar view year/month to match current value
      const parts = value.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        if (!isNaN(y) && !isNaN(m)) {
          setViewYear(y);
          setViewMonth(m);
        }
      }
    } else {
      setDisplayText('');
      setIsInvalid(false);
    }
  }, [value]);

  // Close calendar popover on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsCalendarOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCalendarOpen(false);
      }
    };

    if (isCalendarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCalendarOpen]);

  // Handle manual typing
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setDisplayText(text);

    if (!text.trim()) {
      setIsInvalid(false);
      onChange(null);
      return;
    }

    if (isValidDisplayDate(text)) {
      setIsInvalid(false);
      const dbDate = parseToDbDate(text);
      onChange(dbDate);
      if (dbDate) {
        const parts = dbDate.split('-');
        setViewYear(parseInt(parts[0], 10));
        setViewMonth(parseInt(parts[1], 10) - 1);
      }
    } else {
      setIsInvalid(true);
    }
  };

  const handleClear = () => {
    setDisplayText('');
    setIsInvalid(false);
    onChange(null);
    setIsCalendarOpen(false);
  };

  const handleSetToday = () => {
    const todayDb = getTodayDbDate();
    const todayDisplay = getTodayDisplayDate();
    setDisplayText(todayDisplay);
    setIsInvalid(false);
    onChange(todayDb);
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setIsCalendarOpen(false);
  };

  // Calendar day selection
  const handleSelectDay = (day: number) => {
    const yStr = String(viewYear);
    const mStr = String(viewMonth + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    const selectedDbDate = `${yStr}-${mStr}-${dStr}`;

    onChange(selectedDbDate);
    setDisplayText(formatToDisplayDate(selectedDbDate));
    setIsInvalid(false);
    setIsCalendarOpen(false);
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  // Calendar grid calculations
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // Monday = 0, Sunday = 6
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

  // Highlight check
  const todayStr = getTodayDbDate();
  const todayParts = todayStr.split('-').map(Number);
  const isTodayMonth = todayParts[0] === viewYear && todayParts[1] - 1 === viewMonth;

  let selectedDayNum: number | null = null;
  if (value) {
    const vParts = value.split('-').map(Number);
    if (vParts[0] === viewYear && vParts[1] - 1 === viewMonth) {
      selectedDayNum = vParts[2];
    }
  }

  // Year options for fast dropdown (1990 - 2040)
  const currentYear = new Date().getFullYear();
  const yearOptions: number[] = [];
  for (let y = currentYear - 20; y <= currentYear + 15; y++) {
    yearOptions.push(y);
  }

  return (
    <div ref={containerRef} className={`relative flex flex-col gap-1 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between"
        >
          <span>
            {label} {required && <span className="text-red-500">*</span>}
          </span>
          <span className="text-[10px] text-slate-400 font-normal">dd-MM-yyyy</span>
        </label>
      )}

      <div className="relative flex items-center">
        <input
          id={id}
          type="text"
          value={displayText}
          onChange={handleTextChange}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={10}
          className={`w-full px-3 py-2 pr-20 text-xs sm:text-sm bg-white dark:bg-slate-800 border rounded-md font-mono text-slate-800 dark:text-slate-100 placeholder-slate-400 transition-colors focus:outline-none focus:ring-1 ${
            isInvalid
              ? 'border-red-400 focus:border-red-500 focus:ring-red-400'
              : 'border-slate-300 dark:border-slate-600 focus:border-blue-600 dark:focus:border-blue-400 focus:ring-blue-500'
          } ${disabled ? 'bg-slate-100 dark:bg-slate-900 cursor-not-allowed text-slate-400' : ''}`}
        />

        <div className="absolute right-1.5 flex items-center gap-1">
          {displayText && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              title="Clear date"
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={handleSetToday}
            title="Set today's date"
            disabled={disabled}
            className="px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded transition-colors"
          >
            Today
          </button>

          <button
            type="button"
            onClick={() => !disabled && setIsCalendarOpen(!isCalendarOpen)}
            disabled={disabled}
            title="Open calendar picker"
            className={`p-1.5 rounded transition-colors ${
              isCalendarOpen
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isInvalid && (
        <span className="text-[11px] text-red-500">
          Please enter a valid date in format dd-MM-yyyy (e.g. {getTodayDisplayDate()})
        </span>
      )}

      {/* Interactive Calendar Popover Dropdown */}
      {isCalendarOpen && (
        <div
          className={`absolute top-full ${
            effectiveAlign === 'right' ? 'right-0' : 'left-0'
          } mt-1 z-50 w-72 bg-white dark:bg-slate-900 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-750 p-3.5 animate-in fade-in select-none text-slate-800 dark:text-slate-100 font-sans`}
          style={{ minWidth: '280px' }}
        >
          {/* Calendar Header with Month/Year Navigation */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5">
              {/* Month selector */}
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
                className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-none rounded px-2 py-0.5 text-xs font-semibold focus:outline-none cursor-pointer"
              >
                {MONTH_NAMES.map((m, idx) => (
                  <option key={m} value={idx}>
                    {m}
                  </option>
                ))}
              </select>

              {/* Year selector */}
              <select
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
                className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-none rounded px-2 py-0.5 text-xs font-semibold font-mono focus:outline-none cursor-pointer"
              >
                {yearOptions.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Row */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-slate-400 uppercase mb-1">
            {WEEKDAYS.map((wd) => (
              <div key={wd} className="py-0.5">
                {wd}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {/* Days from previous month */}
            {Array.from({ length: firstDayIndex }).map((_, i) => {
              const dayNum = prevMonthDays - firstDayIndex + i + 1;
              return (
                <div
                  key={`prev-${i}`}
                  className="py-1.5 text-slate-300 dark:text-slate-600 font-mono text-[11px] cursor-not-allowed"
                >
                  {dayNum}
                </div>
              );
            })}

            {/* Days of current month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const isSelected = selectedDayNum === dayNum;
              const isToday = isTodayMonth && todayParts[2] === dayNum;

              return (
                <button
                  key={`day-${dayNum}`}
                  type="button"
                  onClick={() => handleSelectDay(dayNum)}
                  className={`py-1.5 font-mono text-xs rounded transition-colors flex items-center justify-center ${
                    isSelected
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : isToday
                      ? 'border border-blue-500 text-blue-600 dark:text-blue-400 font-bold bg-blue-50/50 dark:bg-blue-950/40 hover:bg-blue-100'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>

          {/* Popover Footer: Quick Actions */}
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors"
            >
              Clear
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSetToday}
                className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                Jump to Today
              </button>
              <button
                type="button"
                onClick={() => setIsCalendarOpen(false)}
                className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
