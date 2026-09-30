/**
 * VolumnBook — CSV Import & Export Utilities
 * RFC 4180 compliant CSV parser, delimiter auto-detection, column mapping,
 * multi-format date normalization, duplicate detection, and sample generator.
 */

import { ColumnMapping, ParsedImportRow, VolumeRecord } from '../types';
import { parseAnyDateToDbDate, formatToDisplayDate, validateDateSequence } from './dateUtils';
import { triggerFileDownload } from './exportUtils';

export interface CsvParseResult {
  headers: string[];
  rows: string[][];
  detectedDelimiter: string;
  totalLines: number;
}

/**
 * Detects the most probable delimiter from sample CSV text
 */
export function detectDelimiter(text: string): string {
  const firstLines = text.split(/\r\n|\n|\r/).slice(0, 5).join('\n');
  const counts: Record<string, number> = {
    ',': (firstLines.match(/,/g) || []).length,
    ';': (firstLines.match(/;/g) || []).length,
    '\t': (firstLines.match(/\t/g) || []).length,
    '|': (firstLines.match(/\|/g) || []).length,
  };

  let bestDelimiter = ',';
  let maxCount = -1;
  for (const [delim, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      bestDelimiter = delim;
    }
  }

  return maxCount > 0 ? bestDelimiter : ',';
}

/**
 * RFC 4180 compliant CSV parser supporting quoted values, escaped quotes,
 * embedded newlines, and arbitrary delimiters.
 */
export function parseCsvText(rawText: string, customDelimiter?: string): CsvParseResult {
  // Strip UTF-8 Byte Order Mark (BOM) if present
  let text = rawText.replace(/^\uFEFF/, '');
  const delimiter = customDelimiter || detectDelimiter(text);

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentToken = '';
  let inQuotes = false;

  let i = 0;
  const len = text.length;

  while (i < len) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < len && text[i + 1] === '"') {
          // Escaped quote: ""
          currentToken += '"';
          i += 2;
          continue;
        } else {
          // Closing quote
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        currentToken += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
        continue;
      }

      if (char === delimiter) {
        currentRow.push(currentToken.trim());
        currentToken = '';
        i++;
        continue;
      }

      if (char === '\r') {
        if (i + 1 < len && text[i + 1] === '\n') {
          i++;
        }
        currentRow.push(currentToken.trim());
        currentToken = '';
        if (currentRow.some((col) => col !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        i++;
        continue;
      }

      if (char === '\n') {
        currentRow.push(currentToken.trim());
        currentToken = '';
        if (currentRow.some((col) => col !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        i++;
        continue;
      }

      currentToken += char;
      i++;
    }
  }

  // Push final token and row if non-empty
  if (currentToken || currentRow.length > 0) {
    currentRow.push(currentToken.trim());
    if (currentRow.some((col) => col !== '')) {
      rows.push(currentRow);
    }
  }

  if (rows.length === 0) {
    return {
      headers: [],
      rows: [],
      detectedDelimiter: delimiter,
      totalLines: 0,
    };
  }

  const headers = rows[0].map((h) => h.trim());
  const dataRows = rows.slice(1);

  return {
    headers,
    rows: dataRows,
    detectedDelimiter: delimiter,
    totalLines: rows.length,
  };
}

/**
 * Automatically suggests column mapping based on standard case management headers
 */
export function autoDetectColumnMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {
    caseNo: '',
    judgementDate: '',
    draftDate: '',
    finalDate: '',
    sendToSectionDate: '',
    remarks: '',
    serialNo: '',
  };

  const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

  headers.forEach((header) => {
    const c = clean(header);

    // Case No
    if (!mapping.caseNo) {
      if (
        c === 'caseno' ||
        c === 'casenumber' ||
        c === 'case' ||
        c === 'caseid' ||
        c === 'casename' ||
        c === 'suitno' ||
        c === 'appealno' ||
        c === 'fileno' ||
        c.includes('caseno')
      ) {
        mapping.caseNo = header;
        return;
      }
    }

    // Serial No
    if (!mapping.serialNo) {
      if (
        c === 'serialno' ||
        c === 'serial' ||
        c === 'sl' ||
        c === 'slno' ||
        c === 'srno' ||
        c === 'sno' ||
        c === 'id' ||
        c === 'index'
      ) {
        mapping.serialNo = header;
        return;
      }
    }

    // Judgement Date
    if (!mapping.judgementDate) {
      if (
        c.includes('judgement') ||
        c.includes('judgment') ||
        c.includes('orderdate') ||
        c === 'jdate'
      ) {
        mapping.judgementDate = header;
        return;
      }
    }

    // Draft Date
    if (!mapping.draftDate) {
      if (c.includes('draft') || c === 'ddate') {
        mapping.draftDate = header;
        return;
      }
    }

    // Final Date
    if (!mapping.finalDate) {
      if (
        c.includes('final') ||
        c.includes('signed') ||
        c.includes('approved') ||
        c === 'fdate'
      ) {
        mapping.finalDate = header;
        return;
      }
    }

    // Send to Section Date
    if (!mapping.sendToSectionDate) {
      if (
        c.includes('section') ||
        c.includes('dispatch') ||
        c.includes('despatch') ||
        c.includes('sentdate') ||
        c === 'sdate'
      ) {
        mapping.sendToSectionDate = header;
        return;
      }
    }

    // Remarks
    if (!mapping.remarks) {
      if (
        c.includes('remark') ||
        c.includes('comment') ||
        c.includes('note') ||
        c.includes('desc') ||
        c.includes('detail')
      ) {
        mapping.remarks = header;
        return;
      }
    }
  });

  return mapping;
}

/**
 * Validates, normalizes, and transforms raw rows according to mapping
 */
export function processImportRows(
  rows: string[][],
  headers: string[],
  mapping: ColumnMapping,
  existingCaseNumbers: Set<string>
): ParsedImportRow[] {
  const headerIndexMap: Record<string, number> = {};
  headers.forEach((h, idx) => {
    headerIndexMap[h] = idx;
  });

  const getColVal = (row: string[], colName?: string): string => {
    if (!colName) return '';
    const idx = headerIndexMap[colName];
    if (idx === undefined || idx < 0 || idx >= row.length) return '';
    return (row[idx] || '').trim();
  };

  const seenInCsv = new Map<string, number>(); // CaseNo -> first seen row number
  const parsedRows: ParsedImportRow[] = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 1;
    const errors: string[] = [];
    const warnings: string[] = [];

    // Extract Case No
    const rawCaseNo = getColVal(row, mapping.caseNo);
    if (!rawCaseNo) {
      errors.push('Case No is missing or empty.');
    }

    const normalizedCaseNo = rawCaseNo.toUpperCase();

    // Check duplicates
    let isCsvDuplicate = false;
    if (normalizedCaseNo) {
      if (seenInCsv.has(normalizedCaseNo)) {
        isCsvDuplicate = true;
        warnings.push(`Duplicate Case No within CSV (first appeared at row ${seenInCsv.get(normalizedCaseNo)}).`);
      } else {
        seenInCsv.set(normalizedCaseNo, rowNumber);
      }
    }

    // Check DB duplicate
    const isExistingCaseNo = normalizedCaseNo ? existingCaseNumbers.has(normalizedCaseNo) : false;
    if (isExistingCaseNo) {
      warnings.push('Case No already exists in database.');
    }

    const isDuplicate = isCsvDuplicate || isExistingCaseNo;

    // Serial No (optional)
    let serialNo: number | null = null;
    const rawSerial = getColVal(row, mapping.serialNo);
    if (rawSerial) {
      const parsedNum = parseInt(rawSerial, 10);
      if (!isNaN(parsedNum) && parsedNum > 0) {
        serialNo = parsedNum;
      }
    }

    // Dates normalization
    const rawJDate = getColVal(row, mapping.judgementDate);
    const jDate = rawJDate ? parseAnyDateToDbDate(rawJDate) : null;
    if (rawJDate && !jDate) {
      warnings.push(`Judgement Date "${rawJDate}" format could not be verified.`);
    }

    const rawDDate = getColVal(row, mapping.draftDate);
    const dDate = rawDDate ? parseAnyDateToDbDate(rawDDate) : null;
    if (rawDDate && !dDate) {
      warnings.push(`Draft Date "${rawDDate}" format could not be verified.`);
    }

    const rawFDate = getColVal(row, mapping.finalDate);
    const fDate = rawFDate ? parseAnyDateToDbDate(rawFDate) : null;
    if (rawFDate && !fDate) {
      warnings.push(`Final Date "${rawFDate}" format could not be verified.`);
    }

    const rawSDate = getColVal(row, mapping.sendToSectionDate);
    const sDate = rawSDate ? parseAnyDateToDbDate(rawSDate) : null;
    if (rawSDate && !sDate) {
      warnings.push(`Send to Section Date "${rawSDate}" format could not be verified.`);
    }

    // Date Sequence Logical Check
    const dateSeq = validateDateSequence({
      judgementDate: jDate,
      draftDate: dDate,
      finalDate: fDate,
      sendToSectionDate: sDate,
    });

    if (!dateSeq.valid) {
      dateSeq.warnings.forEach((w) => warnings.push(w));
    }

    // Remarks
    const rawRemarks = getColVal(row, mapping.remarks);
    const remarks = rawRemarks || null;

    parsedRows.push({
      rowNumber,
      caseNo: rawCaseNo,
      serialNo,
      judgementDate: jDate,
      draftDate: dDate,
      finalDate: fDate,
      sendToSectionDate: sDate,
      remarks,
      isValid: errors.length === 0,
      errors,
      warnings,
      isExistingCaseNo,
      isDuplicate,
      isCsvDuplicate,
    });
  });

  return parsedRows;
}

/**
 * Generates official Sample CSV template content
 */
export function generateSampleCsv(): string {
  return [
    'Serial No,Case No,Judgement Date,Draft Date,Final Date,Send To Section Date,Remarks',
    '1,WP/1042/2023,12-01-2024,18-01-2024,25-01-2024,30-01-2024,Full bench judgement delivered',
    '2,CRL.A/509/2022,15-02-2024,22-02-2024,28-02-2024,05-03-2024,Appellant acquitted on merit',
    '3,CIVIL/782/2021,10-03-2024,20-03-2024,29-03-2024,04-04-2024,Decree drawn and sealed',
    '4,WP/3421/2023,05-04-2024,14-04-2024,,,Awaiting final signature & draft approval',
    '5,TAX/88/2024,20-04-2024,,,,Judgement dictated in open court',
    '6,ARB/12/2024,02-05-2024,10-05-2024,18-05-2024,,Final award submitted for review',
    '7,CONT/441/2023,16-05-2024,24-05-2024,31-05-2024,07-06-2024,Contempt notice disposed with compliance',
    '8,MAT/910/2022,01-06-2024,12-06-2024,,,Draft prepared by research associate',
  ].join('\r\n');
}

/**
 * Downloads standard Sample CSV template for user
 */
export function downloadSampleCsv(): void {
  const content = generateSampleCsv();
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  triggerFileDownload(blob, 'VolumnBook_Sample_Template.csv');
}

/**
 * Exports existing database records to clean CSV file
 */
export function exportRecordsToCsv(records: VolumeRecord[], customFilename?: string): void {
  const escapeCsv = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headers = [
    'Serial No',
    'Case No',
    'Judgement Date',
    'Draft Date',
    'Final Date',
    'Send To Section Date',
    'Remarks',
  ];

  const lines = [headers.join(',')];

  records.forEach((r) => {
    const row = [
      escapeCsv(r.SerialNo),
      escapeCsv(r.CaseNo),
      escapeCsv(formatToDisplayDate(r.JudgementDate)),
      escapeCsv(formatToDisplayDate(r.DraftDate)),
      escapeCsv(formatToDisplayDate(r.FinalDate)),
      escapeCsv(formatToDisplayDate(r.SendToSectionDate)),
      escapeCsv(r.Remarks || ''),
    ];
    lines.push(row.join(','));
  });

  const content = lines.join('\r\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const filename = customFilename || `VolumnBook_Export_${new Date().toISOString().slice(0, 10)}.csv`;
  triggerFileDownload(blob, filename);
}
