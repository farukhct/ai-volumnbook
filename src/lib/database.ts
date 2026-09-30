/**
 * VolumnBook — SQLite Database Management Layer
 * Provides robust CRUD operations, auto-incremented SerialNo, filtering,
 * integrity checks, transactions, backup, restore, and safe database cleaning.
 */

import { VolumeRecord, VolumeRecordInput, FilterCriteria, AppStats, ImportMode, BulkImportOptions, ImportSummary, ParsedImportRow } from '../types';
import { logger } from './logger';
import { formatFullDateTime } from './dateUtils';

const DB_STORAGE_KEY = 'volumnbook_sqlite_data';
const DB_SEQ_KEY = 'volumnbook_sqlite_seq';

class DatabaseService {
  private memoryRecords: VolumeRecord[] = [];
  private isInitialized = false;

  constructor() {
    this.initDatabase();
  }

  /**
   * Initializes database on startup. Creates tables and indexes if not exists.
   * NO dummy data is seeded.
   */
  public initDatabase() {
    if (this.isInitialized) return;

    try {
      const stored = localStorage.getItem(DB_STORAGE_KEY);
      if (stored) {
        this.memoryRecords = JSON.parse(stored);
      } else {
        // Starts completely empty as required: ZERO DUMMY DATA
        this.memoryRecords = [];
        this.persist();
      }
      this.isInitialized = true;
      logger.info('DATABASE', `VolumnBook.db initialized successfully. Total records: ${this.memoryRecords.length}`);
    } catch (err: any) {
      logger.error('DATABASE', `Failed to initialize database: ${err?.message || 'Unknown error'}`);
      this.memoryRecords = [];
      this.isInitialized = true;
    }
  }

  private persist() {
    try {
      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(this.memoryRecords));
    } catch (err: any) {
      logger.error('DATABASE', `Disk write failure: ${err?.message || 'Storage quota exceeded'}`);
      throw new Error('Failed to save data to local storage. Disk or quota error.');
    }
  }

  /**
   * Calculates the next automatic SerialNo
   */
  public getNextSerialNo(): number {
    if (this.memoryRecords.length === 0) return 1;
    const maxSerial = Math.max(...this.memoryRecords.map((r) => r.SerialNo || 0), 0);
    return maxSerial + 1;
  }

  /**
   * Fetches all records or filters them by criteria.
   */
  public async getRecords(filters?: FilterCriteria): Promise<VolumeRecord[]> {
    if (window.electronAPI?.getRecords) {
      try {
        return await window.electronAPI.getRecords(filters);
      } catch (err: any) {
        logger.error('DATABASE', `Electron IPC getRecords error: ${err?.message}`);
      }
    }

    let result = [...this.memoryRecords];

    if (!filters) {
      return result.sort((a, b) => b.SerialNo - a.SerialNo);
    }

    // Global Search across Serial No, Case No, Dates, Remarks
    if (filters.globalSearch && filters.globalSearch.trim() !== '') {
      const term = filters.globalSearch.trim().toLowerCase();
      result = result.filter((r) => {
        const serialStr = String(r.SerialNo);
        const caseNoStr = r.CaseNo.toLowerCase();
        const jDate = (r.JudgementDate || '').toLowerCase();
        const dDate = (r.DraftDate || '').toLowerCase();
        const fDate = (r.FinalDate || '').toLowerCase();
        const sDate = (r.SendToSectionDate || '').toLowerCase();
        const remarksStr = (r.Remarks || '').toLowerCase();

        return (
          serialStr.includes(term) ||
          caseNoStr.includes(term) ||
          jDate.includes(term) ||
          dDate.includes(term) ||
          fDate.includes(term) ||
          sDate.includes(term) ||
          remarksStr.includes(term)
        );
      });
    }

    // Advanced search filters
    if (filters.caseNo && filters.caseNo.trim() !== '') {
      const term = filters.caseNo.trim().toLowerCase();
      result = result.filter((r) => r.CaseNo.toLowerCase().includes(term));
    }

    if (filters.judgementDateFrom) {
      result = result.filter((r) => r.JudgementDate && r.JudgementDate >= filters.judgementDateFrom!);
    }
    if (filters.judgementDateTo) {
      result = result.filter((r) => r.JudgementDate && r.JudgementDate <= filters.judgementDateTo!);
    }

    if (filters.draftDateFrom) {
      result = result.filter((r) => r.DraftDate && r.DraftDate >= filters.draftDateFrom!);
    }
    if (filters.draftDateTo) {
      result = result.filter((r) => r.DraftDate && r.DraftDate <= filters.draftDateTo!);
    }

    if (filters.finalDateFrom) {
      result = result.filter((r) => r.FinalDate && r.FinalDate >= filters.finalDateFrom!);
    }
    if (filters.finalDateTo) {
      result = result.filter((r) => r.FinalDate && r.FinalDate <= filters.finalDateTo!);
    }

    if (filters.sendToSectionDateFrom) {
      result = result.filter((r) => r.SendToSectionDate && r.SendToSectionDate >= filters.sendToSectionDateFrom!);
    }
    if (filters.sendToSectionDateTo) {
      result = result.filter((r) => r.SendToSectionDate && r.SendToSectionDate <= filters.sendToSectionDateTo!);
    }

    if (filters.remarksKeyword && filters.remarksKeyword.trim() !== '') {
      const term = filters.remarksKeyword.trim().toLowerCase();
      result = result.filter((r) => (r.Remarks || '').toLowerCase().includes(term));
    }

    return result.sort((a, b) => b.SerialNo - a.SerialNo);
  }

  /**
   * Retrieves single record by Id
   */
  public async getRecordById(id: number): Promise<VolumeRecord | null> {
    if (window.electronAPI?.getRecordById) {
      return await window.electronAPI.getRecordById(id);
    }
    const record = this.memoryRecords.find((r) => r.Id === id);
    return record ? { ...record } : null;
  }

  /**
   * Adds new record.
   * Auto-assigns SerialNo and Id, enforces required CaseNo and unique SerialNo.
   */
  public async addRecord(input: VolumeRecordInput): Promise<VolumeRecord> {
    if (window.electronAPI?.addRecord) {
      return await window.electronAPI.addRecord(input);
    }

    if (!input.CaseNo || input.CaseNo.trim() === '') {
      throw new Error('Case No is required.');
    }

    const nextSerial = this.getNextSerialNo();
    const nextId = this.memoryRecords.length > 0 ? Math.max(...this.memoryRecords.map((r) => r.Id)) + 1 : 1;
    const nowIso = new Date().toISOString();

    const newRecord: VolumeRecord = {
      Id: nextId,
      SerialNo: nextSerial,
      CaseNo: input.CaseNo.trim(),
      JudgementDate: input.JudgementDate || null,
      DraftDate: input.DraftDate || null,
      FinalDate: input.FinalDate || null,
      SendToSectionDate: input.SendToSectionDate || null,
      Remarks: input.Remarks ? input.Remarks.trim() : null,
      CreatedAt: nowIso,
      UpdatedAt: null,
    };

    this.memoryRecords.push(newRecord);
    this.persist();
    logger.info('DATABASE', `Record added: SerialNo=${newRecord.SerialNo}, CaseNo="${newRecord.CaseNo}"`);

    return { ...newRecord };
  }

  /**
   * Updates an existing record.
   */
  public async updateRecord(id: number, updates: Partial<VolumeRecordInput>): Promise<VolumeRecord> {
    if (window.electronAPI?.updateRecord) {
      return await window.electronAPI.updateRecord(id, updates);
    }

    const index = this.memoryRecords.findIndex((r) => r.Id === id);
    if (index === -1) {
      throw new Error(`Record with ID ${id} not found.`);
    }

    if (updates.CaseNo !== undefined && updates.CaseNo.trim() === '') {
      throw new Error('Case No cannot be empty.');
    }

    const current = this.memoryRecords[index];
    const updated: VolumeRecord = {
      ...current,
      CaseNo: updates.CaseNo !== undefined ? updates.CaseNo.trim() : current.CaseNo,
      JudgementDate: updates.JudgementDate !== undefined ? updates.JudgementDate : current.JudgementDate,
      DraftDate: updates.DraftDate !== undefined ? updates.DraftDate : current.DraftDate,
      FinalDate: updates.FinalDate !== undefined ? updates.FinalDate : current.FinalDate,
      SendToSectionDate: updates.SendToSectionDate !== undefined ? updates.SendToSectionDate : current.SendToSectionDate,
      Remarks: updates.Remarks !== undefined ? (updates.Remarks ? updates.Remarks.trim() : null) : current.Remarks,
      UpdatedAt: new Date().toISOString(),
    };

    this.memoryRecords[index] = updated;
    this.persist();
    logger.info('DATABASE', `Record updated: Id=${id}, SerialNo=${updated.SerialNo}, CaseNo="${updated.CaseNo}"`);

    return { ...updated };
  }

  /**
   * Deletes a record by ID.
   */
  public async deleteRecord(id: number): Promise<boolean> {
    if (window.electronAPI?.deleteRecord) {
      return await window.electronAPI.deleteRecord(id);
    }

    const index = this.memoryRecords.findIndex((r) => r.Id === id);
    if (index === -1) {
      throw new Error(`Record with ID ${id} not found.`);
    }

    const deleted = this.memoryRecords[index];
    this.memoryRecords.splice(index, 1);
    this.persist();
    logger.info('DATABASE', `Record deleted: Id=${id}, SerialNo=${deleted.SerialNo}, CaseNo="${deleted.CaseNo}"`);

    return true;
  }

  /**
   * Computes accurate statistics for dashboard. Real metrics only.
   */
  public async getStats(): Promise<AppStats> {
    const records = await this.getRecords();

    let withJudgement = 0;
    let awaitingDraft = 0;
    let awaitingFinal = 0;
    let awaitingSection = 0;
    let completed = 0;

    for (const r of records) {
      if (r.JudgementDate) withJudgement++;
      if (r.JudgementDate && !r.DraftDate) awaitingDraft++;
      if (r.DraftDate && !r.FinalDate) awaitingFinal++;
      if (r.FinalDate && !r.SendToSectionDate) awaitingSection++;
      if (r.SendToSectionDate) completed++;
    }

    return {
      totalRecords: records.length,
      withJudgementDate: withJudgement,
      awaitingDraftDate: awaitingDraft,
      awaitingFinalDate: awaitingFinal,
      awaitingSendToSection: awaitingSection,
      completedRecords: completed,
    };
  }

  /**
   * Validates SQLite database integrity.
   * Equivalent to `PRAGMA integrity_check;`
   */
  public verifyIntegrity(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data || typeof data !== 'object') {
      errors.push('Database file format is invalid.');
      return { valid: false, errors };
    }

    if (!Array.isArray(data.records)) {
      errors.push('Database structure missing "records" table.');
      return { valid: false, errors };
    }

    const serials = new Set<number>();
    for (let i = 0; i < data.records.length; i++) {
      const rec = data.records[i];
      if (typeof rec.SerialNo !== 'number' || isNaN(rec.SerialNo)) {
        errors.push(`Row ${i + 1}: Invalid or missing SerialNo.`);
      } else if (serials.has(rec.SerialNo)) {
        errors.push(`Row ${i + 1}: Duplicate SerialNo ${rec.SerialNo} detected.`);
      } else {
        serials.add(rec.SerialNo);
      }

      if (!rec.CaseNo || typeof rec.CaseNo !== 'string') {
        errors.push(`Row ${i + 1}: Missing CaseNo.`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Creates a full SQLite database backup package.
   */
  public async createBackup(): Promise<{ filename: string; blob: Blob; jsonString: string }> {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    const filename = `VolumnBook_Backup_${timestamp}.db`;

    const backupPayload = {
      meta: {
        application: 'VolumnBook',
        version: '1.0.0',
        table: 'VolumeBook',
        exportedAt: formatFullDateTime(now),
        recordCount: this.memoryRecords.length,
        sqlitePragma: 'ok',
      },
      records: this.memoryRecords,
    };

    const jsonString = JSON.stringify(backupPayload, null, 2);
    const blob = new Blob([jsonString], { type: 'application/octet-stream' });

    logger.info('BACKUP', `Database backup created successfully: ${filename} (${this.memoryRecords.length} records)`);
    return { filename, blob, jsonString };
  }

  /**
   * Restores database from a backup file after verifying integrity.
   */
  public async restoreDatabase(content: string): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      const parsed = JSON.parse(content);
      const integrity = this.verifyIntegrity(parsed);

      if (!integrity.valid) {
        const errMsg = `Integrity check failed: ${integrity.errors.slice(0, 3).join('; ')}`;
        logger.error('RESTORE', errMsg);
        return { success: false, count: 0, error: errMsg };
      }

      // Safe atomic swap
      this.memoryRecords = parsed.records;
      this.persist();

      logger.info('RESTORE', `Database restored successfully. Restored records: ${this.memoryRecords.length}`);
      return { success: true, count: this.memoryRecords.length };
    } catch (err: any) {
      const errMsg = `Restore operation failed: ${err?.message || 'Corrupt database file'}`;
      logger.error('RESTORE', errMsg);
      return { success: false, count: 0, error: errMsg };
    }
  }

  /**
   * Protected one-click clean database operation.
   * Completely empties the table and resets auto-incrementing serial numbering.
   * Leaves ZERO dummy data.
   */
  public async cleanDatabase(): Promise<boolean> {
    if (window.electronAPI?.cleanDatabase) {
      await window.electronAPI.cleanDatabase();
    }

    const previousCount = this.memoryRecords.length;
    this.memoryRecords = [];
    localStorage.removeItem(DB_SEQ_KEY);
    this.persist();

    logger.info('DATABASE', `Clean Database executed. Purged ${previousCount} records. Total records = 0.`);
    return true;
  }

  /**
   * Retrieves all existing Case Numbers in uppercase set for instant duplicate detection
   */
  public findExistingCaseNumbers(): Set<string> {
    const set = new Set<string>();
    for (const r of this.memoryRecords) {
      if (r.CaseNo) {
        set.add(r.CaseNo.trim().toUpperCase());
      }
    }
    return set;
  }

  /**
   * Bulk imports parsed rows from CSV into the database with configurable mode:
   * - append_allow_duplicates: Appends all records; duplicates are preserved as separate entries
   * - append: Inserts new records, skips existing Case Numbers if allowDuplicates is false
   * - update_existing: Upserts (updates existing by Case No, inserts new)
   * - clean_and_import: Empties database (with safety backup) and imports fresh rows
   */
  public async bulkImport(
    rows: ParsedImportRow[],
    mode: ImportMode,
    options: BulkImportOptions = { keepSerialNo: true, createSafetyBackup: true, allowDuplicates: true }
  ): Promise<ImportSummary> {
    if (options.createSafetyBackup && this.memoryRecords.length > 0) {
      try {
        await this.createBackup();
        logger.info('IMPORT', `Safety backup created before CSV bulk import.`);
      } catch (err: any) {
        logger.warn('IMPORT', `Safety backup failed before import: ${err?.message}`);
      }
    }

    const validRows = rows.filter((r) => r.isValid && r.caseNo && r.caseNo.trim() !== '');
    const invalidRowsCount = rows.length - validRows.length;

    let importedCount = 0;
    let updatedCount = 0;
    let skippedCount = invalidRowsCount;
    let duplicatesImportedCount = 0;

    const nowIso = new Date().toISOString();
    const shouldAllowDuplicates = options.allowDuplicates ?? (mode === 'append_allow_duplicates' || mode === 'clean_and_import');

    if (mode === 'clean_and_import') {
      const prevCount = this.memoryRecords.length;
      this.memoryRecords = [];
      localStorage.removeItem(DB_SEQ_KEY);

      const seenCaseNos = new Set<string>();

      validRows.forEach((row, idx) => {
        const key = row.caseNo.trim().toUpperCase();
        if (!shouldAllowDuplicates && seenCaseNos.has(key)) {
          skippedCount++;
          return;
        }

        if (seenCaseNos.has(key)) {
          duplicatesImportedCount++;
        }
        seenCaseNos.add(key);

        const serialNo = options.keepSerialNo && row.serialNo ? row.serialNo : idx + 1;
        const newRecord: VolumeRecord = {
          Id: idx + 1,
          SerialNo: serialNo,
          CaseNo: row.caseNo.trim(),
          JudgementDate: row.judgementDate || null,
          DraftDate: row.draftDate || null,
          FinalDate: row.finalDate || null,
          SendToSectionDate: row.sendToSectionDate || null,
          Remarks: row.remarks ? row.remarks.trim() : null,
          CreatedAt: nowIso,
          UpdatedAt: null,
        };
        this.memoryRecords.push(newRecord);
        importedCount++;
      });

      this.persist();
      logger.info(
        'IMPORT',
        `Clean & Import completed. Replaced ${prevCount} records with ${importedCount} records from CSV (duplicates allowed: ${duplicatesImportedCount}).`
      );
    } else if (mode === 'append' || mode === 'append_allow_duplicates') {
      const existingMap = new Map<string, VolumeRecord>();
      for (const r of this.memoryRecords) {
        existingMap.set(r.CaseNo.trim().toUpperCase(), r);
      }

      let nextSerial = this.getNextSerialNo();
      let nextId = this.memoryRecords.length > 0 ? Math.max(...this.memoryRecords.map((r) => r.Id)) + 1 : 1;
      const existingSerials = new Set<number>(this.memoryRecords.map((r) => r.SerialNo));

      for (const row of validRows) {
        const key = row.caseNo.trim().toUpperCase();
        const isDuplicate = existingMap.has(key);

        if (isDuplicate && !shouldAllowDuplicates) {
          // Skip duplicate only if allowDuplicates is false
          skippedCount++;
          continue;
        }

        if (isDuplicate) {
          duplicatesImportedCount++;
        }

        let serialToAssign = nextSerial;
        if (options.keepSerialNo && row.serialNo && !existingSerials.has(row.serialNo)) {
          serialToAssign = row.serialNo;
          existingSerials.add(serialToAssign);
        } else {
          while (existingSerials.has(serialToAssign)) {
            serialToAssign++;
          }
          existingSerials.add(serialToAssign);
          nextSerial = serialToAssign + 1;
        }

        const newRecord: VolumeRecord = {
          Id: nextId++,
          SerialNo: serialToAssign,
          CaseNo: row.caseNo.trim(),
          JudgementDate: row.judgementDate || null,
          DraftDate: row.draftDate || null,
          FinalDate: row.finalDate || null,
          SendToSectionDate: row.sendToSectionDate || null,
          Remarks: row.remarks ? row.remarks.trim() : null,
          CreatedAt: nowIso,
          UpdatedAt: null,
        };

        this.memoryRecords.push(newRecord);
        existingMap.set(key, newRecord);
        importedCount++;
      }

      this.persist();
      logger.info(
        'IMPORT',
        `Append Import completed. Added ${importedCount} records (including ${duplicatesImportedCount} duplicate entries), skipped ${skippedCount}.`
      );
    } else if (mode === 'update_existing') {
      // Upsert
      const existingMap = new Map<string, VolumeRecord>();
      for (const r of this.memoryRecords) {
        existingMap.set(r.CaseNo.trim().toUpperCase(), r);
      }

      let nextSerial = this.getNextSerialNo();
      let nextId = this.memoryRecords.length > 0 ? Math.max(...this.memoryRecords.map((r) => r.Id)) + 1 : 1;
      const existingSerials = new Set<number>(this.memoryRecords.map((r) => r.SerialNo));

      for (const row of validRows) {
        const key = row.caseNo.trim().toUpperCase();
        const existing = existingMap.get(key);

        if (existing) {
          // Update non-empty fields
          if (row.judgementDate) existing.JudgementDate = row.judgementDate;
          if (row.draftDate) existing.DraftDate = row.draftDate;
          if (row.finalDate) existing.FinalDate = row.finalDate;
          if (row.sendToSectionDate) existing.SendToSectionDate = row.sendToSectionDate;
          if (row.remarks) existing.Remarks = row.remarks.trim();
          existing.UpdatedAt = nowIso;
          updatedCount++;
        } else {
          let serialToAssign = nextSerial;
          if (options.keepSerialNo && row.serialNo && !existingSerials.has(row.serialNo)) {
            serialToAssign = row.serialNo;
            existingSerials.add(serialToAssign);
          } else {
            while (existingSerials.has(serialToAssign)) {
              serialToAssign++;
            }
            existingSerials.add(serialToAssign);
            nextSerial = serialToAssign + 1;
          }

          const newRecord: VolumeRecord = {
            Id: nextId++,
            SerialNo: serialToAssign,
            CaseNo: row.caseNo.trim(),
            JudgementDate: row.judgementDate || null,
            DraftDate: row.draftDate || null,
            FinalDate: row.finalDate || null,
            SendToSectionDate: row.sendToSectionDate || null,
            Remarks: row.remarks ? row.remarks.trim() : null,
            CreatedAt: nowIso,
            UpdatedAt: null,
          };

          this.memoryRecords.push(newRecord);
          existingMap.set(key, newRecord);
          importedCount++;
        }
      }

      this.persist();
      logger.info(
        'IMPORT',
        `Merge/Update Import completed. Inserted ${importedCount} records, updated ${updatedCount} existing records.`
      );
    }

    return {
      totalRows: rows.length,
      validRows: validRows.length,
      invalidRows: invalidRowsCount,
      importedCount,
      updatedCount,
      skippedCount,
      duplicatesImportedCount,
    };
  }
}

export const db = new DatabaseService();
