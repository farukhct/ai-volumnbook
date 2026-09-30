-- ==============================================================================
-- VolumnBook — SQLite Database Schema
-- Case & Judgement Volume Management System
-- Database File: VolumnBook.db
-- Default Location: %APPDATA%\VolumnBook\data\VolumnBook.db
-- ==============================================================================

-- Enable Write-Ahead Logging for maximum concurrency and corruption resilience
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA foreign_keys = ON;

-- ------------------------------------------------------------------------------
-- Table: VolumeBook
-- Primary storage for case volume registries
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS VolumeBook (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    SerialNo INTEGER NOT NULL UNIQUE,
    CaseNo TEXT NOT NULL,
    JudgementDate TEXT NULL,        -- Format: YYYY-MM-DD
    DraftDate TEXT NULL,            -- Format: YYYY-MM-DD
    FinalDate TEXT NULL,            -- Format: YYYY-MM-DD
    SendToSectionDate TEXT NULL,    -- Format: YYYY-MM-DD
    Remarks TEXT NULL,
    CreatedAt TEXT NOT NULL,        -- Format: ISO-8601 UTC
    UpdatedAt TEXT NULL             -- Format: ISO-8601 UTC
);

-- ------------------------------------------------------------------------------
-- Indexes for High-Performance On-Demand Querying & Reports
-- ------------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS idx_volumebook_serialno ON VolumeBook (SerialNo);
CREATE INDEX IF NOT EXISTS idx_volumebook_caseno ON VolumeBook (CaseNo);
CREATE INDEX IF NOT EXISTS idx_volumebook_judgement_date ON VolumeBook (JudgementDate);
CREATE INDEX IF NOT EXISTS idx_volumebook_draft_date ON VolumeBook (DraftDate);
CREATE INDEX IF NOT EXISTS idx_volumebook_final_date ON VolumeBook (FinalDate);
CREATE INDEX IF NOT EXISTS idx_volumebook_send_to_section ON VolumeBook (SendToSectionDate);
CREATE INDEX IF NOT EXISTS idx_volumebook_created_at ON VolumeBook (CreatedAt);

-- ------------------------------------------------------------------------------
-- Table: AppSettings
-- Local configuration settings
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS AppSettings (
    Key TEXT PRIMARY KEY,
    Value TEXT NOT NULL,
    UpdatedAt TEXT NOT NULL
);

-- Note: Starts completely EMPTY. ZERO DUMMY DATA IS INSERTED.
