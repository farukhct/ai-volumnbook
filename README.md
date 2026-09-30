# VolumnBook — Case & Judgement Volume Management System

**VolumnBook** is an enterprise-grade, 100% offline Windows desktop application engineered for maintaining case and judgement volume records in judicial, legal, and government office environments.

---

## Key Highlights

- **100% Offline Capability**: Runs entirely locally on Windows with zero internet, cloud, or external API reliance.
- **Embedded SQLite Database Engine**: High-performance local storage with WAL journal mode, automatic indexes, and zero server overhead.
- **Zero Dummy Data**: The database starts completely empty (0 records).
- **Strict Date Standard**: User-facing dates are strictly handled and formatted as `dd-MM-yyyy` (e.g., `29-09-2026`) and safely stored internally as `YYYY-MM-DD`.
- **Chronological Sequence Intelligence**: Validates progression across Judgement Date, Draft Date, Final Date, and Send to Section Date.
- **Automatic Serial No Generation**: Serial numbers are auto-incremented and managed reliably.
- **Multi-Format Document Export & Import**:
  - **CSV Data Import Facility (`Ctrl+I`)**: Full RFC 4180 compliant CSV parser with delimiter auto-detection, intelligent column mapping, date normalization, internal/DB duplicate detection, dedicated duplicate data allowance options (Append All with duplicates permitted or strict deduplication), downloadable sample template, and automated safety backups.
  - **PDF** (`.pdf`) — Official A4 print layout with headers and pagination
  - **Microsoft Word** (`.docx`) — Formatted tables with document styling
  - **Microsoft Excel** (`.xls` & `.xlsx`) and **CSV** (`.csv`) — Spreadsheet tables with auto-column sizing and round-trip re-import capabilities
- **A4 Physical & Virtual Printing**: Dedicated print preview supporting Portrait and Landscape modes.
- **Database Safety Suite**:
  - One-click timestamped `.db` backup creation
  - Safe restoration with `PRAGMA integrity_check` verification
  - Protected clean database facility with confirmation dialogs
- **Security & Desktop Architecture**:
  - Electron runtime with `contextIsolation: true` and `nodeIntegration: false`
  - Parameterized SQLite queries
  - Dark and Light visual themes with local persistence

---

## Technology Stack

| Layer | Technology |
|---|---|
| Desktop Runtime | Electron 33+ |
| Frontend | React 19, TypeScript, Tailwind CSS |
| Database | SQLite 3 (`better-sqlite3` / `sql.js` engine) |
| Exports | `jspdf`, `jspdf-autotable`, `docx`, `xlsx` |
| Packaging | `electron-builder` (NSIS Installer & Portable EXE) |

---

## Directory Structure

```text
VolumnBook/
├── database/
│   └── schema.sql                 # Primary SQLite schema and indexes
├── electron/
│   ├── main.cjs                   # Electron main process & IPC handlers
│   └── preload.cjs                # Secure contextBridge API
├── src/
│   ├── components/                # Header, Sidebar, StatusBar, DatePicker, ConfirmModal
│   ├── lib/                       # database.ts, dateUtils.ts, exportUtils.ts, logger.ts
│   ├── views/                     # 12 modules (Dashboard, Entry, Grid, Search, Reports, etc.)
│   ├── types/                     # TypeScript data interfaces
│   ├── App.tsx                    # Desktop root application shell
│   └── main.tsx                   # React DOM entry point
├── electron-builder.yml           # NSIS Windows installer configuration
├── INSTALLATION_GUIDE.md          # Step-by-step setup guide for end users
├── USER_GUIDE.md                  # Comprehensive operating instructions
├── DATABASE_GUIDE.md              # SQLite schema, indexes, and backup practices
├── BUILD_GUIDE.md                 # Developer compilation and packaging guide
├── TROUBLESHOOTING.md             # Error resolution and log diagnostics
├── CHANGELOG.md                   # Release history (v1.0.0)
└── package.json                   # Dependencies and build scripts
```

---

## Windows Data Locations

In accordance with Windows application standards, database and user data are placed in `%APPDATA%`:

```text
%APPDATA%\VolumnBook\
├── data\
│   └── VolumnBook.db             # Active SQLite database file
├── backups\                       # Timestamped database backups
├── exports\                       # Generated PDF, DOCX, and XLS reports
└── logs\
    └── volumnbook.log             # Local application activity log
```

---

## Quick Start (Development)

```bash
# 1. Install dependencies
npm install

# 2. Run development environment
npm run dev

# 3. Launch Electron desktop shell
npm run electron
```

## Production Packaging

```bash
# Compile frontend build
npm run build

# Generate Windows NSIS Installer (VolumnBook-Setup-1.0.0.exe)
npm run dist
```
