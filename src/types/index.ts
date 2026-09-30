/**
 * VolumnBook — Core Type Definitions
 * Case & Judgement Volume Management System
 */

export interface VolumeRecord {
  Id: number;
  SerialNo: number;
  CaseNo: string;
  JudgementDate: string | null;     // ISO format YYYY-MM-DD
  DraftDate: string | null;         // ISO format YYYY-MM-DD
  FinalDate: string | null;         // ISO format YYYY-MM-DD
  SendToSectionDate: string | null; // ISO format YYYY-MM-DD
  Remarks: string | null;
  CreatedAt: string;                // ISO timestamp
  UpdatedAt: string | null;         // ISO timestamp
}

export type VolumeRecordInput = Omit<VolumeRecord, 'Id' | 'SerialNo' | 'CreatedAt' | 'UpdatedAt'>;

export interface FilterCriteria {
  globalSearch?: string;
  caseNo?: string;
  judgementDateFrom?: string; // YYYY-MM-DD
  judgementDateTo?: string;   // YYYY-MM-DD
  draftDateFrom?: string;
  draftDateTo?: string;
  finalDateFrom?: string;
  finalDateTo?: string;
  sendToSectionDateFrom?: string;
  sendToSectionDateTo?: string;
  remarksKeyword?: string;
}

export type NavigationModule =
  | 'dashboard'
  | 'new-entry'
  | 'all-records'
  | 'search'
  | 'reports'
  | 'print'
  | 'export'
  | 'import'
  | 'backup'
  | 'restore'
  | 'clean'
  | 'settings'
  | 'about';

export type ReportType =
  | 'all-records'
  | 'daily-report'
  | 'date-range'
  | 'case-no-search'
  | 'judgement-date'
  | 'draft-date'
  | 'final-date'
  | 'send-to-section'
  | 'pending-records'
  | 'completed-records'
  | 'custom-filtered';

export type ImportMode = 'append_allow_duplicates' | 'append' | 'update_existing' | 'clean_and_import';

export interface BulkImportOptions {
  keepSerialNo?: boolean;
  createSafetyBackup?: boolean;
  allowDuplicates?: boolean;
}

export interface ColumnMapping {
  caseNo: string;
  judgementDate: string;
  draftDate: string;
  finalDate: string;
  sendToSectionDate: string;
  remarks: string;
  serialNo?: string;
}

export interface ParsedImportRow {
  rowNumber: number;
  caseNo: string;
  judgementDate: string | null;     // ISO YYYY-MM-DD
  draftDate: string | null;         // ISO YYYY-MM-DD
  finalDate: string | null;         // ISO YYYY-MM-DD
  sendToSectionDate: string | null; // ISO YYYY-MM-DD
  remarks: string | null;
  serialNo?: number | null;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  isExistingCaseNo?: boolean;
  isDuplicate?: boolean;
  isCsvDuplicate?: boolean;
}

export interface ImportSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  importedCount: number;
  updatedCount: number;
  skippedCount: number;
  duplicatesImportedCount?: number;
}

export interface AppStats {
  totalRecords: number;
  withJudgementDate: number;
  awaitingDraftDate: number;
  awaitingFinalDate: number;
  awaitingSendToSection: number;
  completedRecords: number;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  defaultOrientation: 'portrait' | 'landscape';
  dateFormat: string;
  databasePath: string;
  autoSafetyBackupOnRestore: boolean;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  category: 'DATABASE' | 'SYSTEM' | 'BACKUP' | 'RESTORE' | 'EXPORT' | 'PRINT' | 'IMPORT';
  message: string;
}

export interface ElectronBridgeAPI {
  isElectron: boolean;
  getRecords: (filters?: FilterCriteria) => Promise<VolumeRecord[]>;
  getRecordById: (id: number) => Promise<VolumeRecord | null>;
  addRecord: (record: VolumeRecordInput) => Promise<VolumeRecord>;
  updateRecord: (id: number, record: Partial<VolumeRecordInput>) => Promise<VolumeRecord>;
  deleteRecord: (id: number) => Promise<boolean>;
  backupDatabase: () => Promise<{ success: boolean; filePath?: string; error?: string }>;
  restoreDatabase: (fileBuffer?: ArrayBuffer) => Promise<{ success: boolean; error?: string }>;
  cleanDatabase: () => Promise<{ success: boolean; error?: string }>;
  printPage: (options?: { landscape?: boolean }) => Promise<void>;
  appVersion: string;
}

declare global {
  interface Window {
    electronAPI?: ElectronBridgeAPI;
  }
}
