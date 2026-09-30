# VolumnBook — Database Architecture & Maintenance Guide

## 1. Engine Specifications

- **Database Engine**: SQLite 3 (Embedded).
- **Driver**: Local native SQLite (`better-sqlite3` / `sql.js`).
- **File Name**: `VolumnBook.db`.
- **Default File Path**: `%APPDATA%\VolumnBook\data\VolumnBook.db`.
- **Concurrency Mode**: WAL (Write-Ahead Logging).
- **Synchronous Mode**: NORMAL (Optimized balance of speed and power-loss resilience).

---

## 2. Table Definition: VolumeBook

```sql
CREATE TABLE VolumeBook (
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
```

### Column Descriptions

| Column | Type | Nullable | Description |
|---|---|---|---|
| `Id` | INTEGER | NO | Internal primary key autoincrement |
| `SerialNo` | INTEGER | NO | Unique volume entry serial number (Auto-generated 1, 2, 3...) |
| `CaseNo` | TEXT | NO | Case identifier (e.g. `WP/2026/1042`) |
| `JudgementDate` | TEXT | YES | Internal `YYYY-MM-DD`, user-facing `dd-MM-yyyy` |
| `DraftDate` | TEXT | YES | Internal `YYYY-MM-DD`, user-facing `dd-MM-yyyy` |
| `FinalDate` | TEXT | YES | Internal `YYYY-MM-DD`, user-facing `dd-MM-yyyy` |
| `SendToSectionDate` | TEXT | YES | Internal `YYYY-MM-DD`, user-facing `dd-MM-yyyy` |
| `Remarks` | TEXT | YES | Optional free-form notes and bench remarks |
| `CreatedAt` | TEXT | NO | Timestamp when record was originally created |
| `UpdatedAt` | TEXT | YES | Timestamp when record was last updated |

---

## 3. Database Indexes

To guarantee instant queries across large volumes, the following indexes are maintained:

```sql
CREATE UNIQUE INDEX idx_volumebook_serialno ON VolumeBook (SerialNo);
CREATE INDEX idx_volumebook_caseno ON VolumeBook (CaseNo);
CREATE INDEX idx_volumebook_judgement_date ON VolumeBook (JudgementDate);
CREATE INDEX idx_volumebook_draft_date ON VolumeBook (DraftDate);
CREATE INDEX idx_volumebook_final_date ON VolumeBook (FinalDate);
CREATE INDEX idx_volumebook_send_to_section ON VolumeBook (SendToSectionDate);
CREATE INDEX idx_volumebook_created_at ON VolumeBook (CreatedAt);
```

---

## 4. Integrity Validation

Before any database restore is executed, the file undergoes integrity validation equivalent to:

```sql
PRAGMA integrity_check;
```

Restorations are halted if:
1. File format is not a valid VolumnBook backup structure.
2. The records table is missing.
3. Any `SerialNo` is missing or duplicate.
4. Any row is missing a `CaseNo`.

---

## 5. Maintenance Best Practices

1. **Never edit `VolumnBook.db` with a generic text editor** (Notepad, WordPad), as this will corrupt binary headers.
2. **Scheduled Backups**: Take daily backups using the built-in "Backup Database" module.
3. **Vacuuming**: Vacuuming is handled during optimization phases to reclaim disk space after large deletions.
