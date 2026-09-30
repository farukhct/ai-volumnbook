# Changelog — VolumnBook

All notable changes to the VolumnBook application are documented in this file.

---

## [1.0.0] — Initial Production Release (2026-09-29)

### Added
- **Core Engine**: Embedded SQLite database architecture with WAL mode and indexes.
- **Strict Date Standards**: Enforced user-facing `dd-MM-yyyy` date formatting and validation with internal `YYYY-MM-DD` normalization.
- **Data Entry**:
  - Auto-generated serial numbering.
  - Logical sequence validation across Judgement, Draft, Final, and Section transmission dates.
  - Manual and calendar date picker inputs with instant "Today" and "Clear" actions.
- **Data Grid (All Records)**:
  - Sticky table headers, column sorting, pagination, and multi-criteria quick filtering.
  - Detail view modal, in-place edit modal, delete confirmation modal, and single-record quick print.
- **On-Demand Search**:
  - Global query across all columns.
  - Advanced multi-field date range filters and remarks keyword matching.
  - Live result counter: `Showing X of Y records`.
- **Reporting System**:
  - 11 dedicated report types: All Records, Daily Activity, Date Range, Case No Search, Judgement Date, Draft Date, Final Date, Send to Section, Pending Records, Completed Records, and Custom Filtered.
- **Printing Facility**:
  - Dedicated A4 print preview supporting Portrait and Landscape modes.
- **Multi-Format Export**:
  - Direct offline generation of PDF, DOCX (Word), and XLS/XLSX (Excel).
- **Database Safeguards**:
  - Atomic, timestamped database backups (`VolumnBook_Backup_YYYY-MM-DD_HH-mm-ss.db`).
  - Safe restoration with `PRAGMA integrity_check` validation and optional automatic safety backup.
  - Protected clean database facility that purges records and resets sequence to #1.
- **Desktop Shell**:
  - Native Windows-style header, collapsible sidebar, status bar, and keyboard shortcuts (<kbd>Ctrl+N</kbd>, <kbd>Ctrl+F</kbd>, <kbd>Ctrl+P</kbd>, <kbd>Ctrl+S</kbd>, <kbd>Ctrl+B</kbd>).
  - Light and Dark themes with local persistence.
  - Local logging system with log viewer and export (`volumnbook.log`).
- **Windows Packaging**:
  - NSIS installer script (`VolumnBook-Setup-1.0.0.exe`) and Portable standalone (`VolumnBook-Portable-1.0.0.exe`).
