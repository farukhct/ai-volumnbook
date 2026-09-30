/**
 * VolumnBook — Date Utilities
 * Strict handling for dd-MM-yyyy display and YYYY-MM-DD database storage
 */

/**
 * Converts a database ISO date (YYYY-MM-DD) into user-facing display format (dd-MM-yyyy).
 */
export function formatToDisplayDate(dbDate: string | null | undefined): string {
  if (!dbDate || typeof dbDate !== 'string') return '';
  const trimmed = dbDate.trim();
  if (!trimmed) return '';

  // If already in dd-MM-yyyy format
  if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
    return trimmed;
  }

  // Handle YYYY-MM-DD
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, year, month, day] = match;
    return `${day}-${month}-${year}`;
  }

  // Fallback for native Date parsing
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const day = String(parsed.getDate()).padStart(2, '0');
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const year = parsed.getFullYear();
    return `${day}-${month}-${year}`;
  }

  return trimmed;
}

/**
 * Converts a user-facing display date (dd-MM-yyyy) into database storage format (YYYY-MM-DD).
 */
export function parseToDbDate(displayDate: string | null | undefined): string | null {
  if (!displayDate || typeof displayDate !== 'string') return null;
  const trimmed = displayDate.trim();
  if (!trimmed) return null;

  // If already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // Handle dd-MM-yyyy or dd/MM/yyyy
  const match = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (match) {
    const [, dayStr, monthStr, yearStr] = match;
    const day = Number(dayStr);
    const month = Number(monthStr);
    const year = Number(yearStr);

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      // Validate days in month
      const maxDays = new Date(year, month, 0).getDate();
      if (day <= maxDays) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
  }

  return null;
}

/**
 * Converts any arbitrary date input (Excel serial number, ISO, dd-MM-yyyy, dd/MM/yyyy, Date object)
 * into a valid YYYY-MM-DD string, or null if invalid or empty.
 */
export function parseAnyDateToDbDate(input: any): string | null {
  if (input === null || input === undefined) return null;

  // Handle native Date
  if (input instanceof Date) {
    if (isNaN(input.getTime())) return null;
    const y = input.getFullYear();
    const m = String(input.getMonth() + 1).padStart(2, '0');
    const d = String(input.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Handle Excel Serial Number (e.g. 45199 = 2023-09-29)
  if (typeof input === 'number') {
    if (input > 1000 && input < 100000) {
      // Excel epoch starts 1899-12-30 due to Lotus 1-2-3 leap year bug
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      const date = new Date(excelEpoch.getTime() + input * 86400000);
      if (!isNaN(date.getTime())) {
        const y = date.getUTCFullYear();
        const m = String(date.getUTCMonth() + 1).padStart(2, '0');
        const d = String(date.getUTCDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
    }
  }

  const str = String(input).trim();
  if (!str) return null;

  // Check standard dd-MM-yyyy via parseToDbDate
  const standardParsed = parseToDbDate(str);
  if (standardParsed) return standardParsed;

  // Check ISO YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    const month = Number(m);
    const day = Number(d);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  // Fallback Date.parse
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    if (y > 1900 && y < 2100) {
      return `${y}-${m}-${d}`;
    }
  }

  return null;
}

/**
 * Validates whether a string is a valid dd-MM-yyyy date.
 */
export function isValidDisplayDate(str: string): boolean {
  if (!str) return false;
  const dbDate = parseToDbDate(str);
  return dbDate !== null;
}

/**
 * Returns today's date formatted as dd-MM-yyyy.
 */
export function getTodayDisplayDate(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Returns today's date in YYYY-MM-DD database format.
 */
export function getTodayDbDate(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  return `${year}-${month}-${day}`;
}

/**
 * Formats a Date object or timestamp into "dd-MM-yyyy HH:mm:ss"
 */
export function formatFullDateTime(date: Date = new Date()): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const mins = String(date.getMinutes()).padStart(2, '0');
  const secs = String(date.getSeconds()).padStart(2, '0');
  return `${day}-${month}-${year} ${hours}:${mins}:${secs}`;
}

/**
 * Formats a Date into timestamp string for filenames: YYYY-MM-DD_HH-mm-ss
 */
export function getFileTimestamp(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const mins = String(date.getMinutes()).padStart(2, '0');
  const secs = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}_${hours}-${mins}-${secs}`;
}

export interface DateOrderValidationResult {
  valid: boolean;
  warnings: string[];
}

/**
 * Validates the chronological sequence of case/judgement dates:
 * Judgement Date <= Draft Date <= Final Date <= Send to Section Date
 */
export function validateDateSequence(dates: {
  judgementDate?: string | null;
  draftDate?: string | null;
  finalDate?: string | null;
  sendToSectionDate?: string | null;
}): DateOrderValidationResult {
  const warnings: string[] = [];

  const jDate = dates.judgementDate ? new Date(dates.judgementDate).getTime() : null;
  const dDate = dates.draftDate ? new Date(dates.draftDate).getTime() : null;
  const fDate = dates.finalDate ? new Date(dates.finalDate).getTime() : null;
  const sDate = dates.sendToSectionDate ? new Date(dates.sendToSectionDate).getTime() : null;

  if (jDate && dDate && dDate < jDate) {
    warnings.push('Draft Date is earlier than Judgement Date.');
  }

  if (dDate && fDate && fDate < dDate) {
    warnings.push('Final Date is earlier than Draft Date.');
  } else if (jDate && fDate && fDate < jDate) {
    warnings.push('Final Date is earlier than Judgement Date.');
  }

  if (fDate && sDate && sDate < fDate) {
    warnings.push('Send to Section Date is earlier than Final Date.');
  } else if (dDate && sDate && sDate < dDate) {
    warnings.push('Send to Section Date is earlier than Draft Date.');
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}
