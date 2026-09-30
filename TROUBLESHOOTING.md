# VolumnBook — Troubleshooting & Diagnostic Guide

This guide addresses common questions, operational anomalies, and error diagnostics for **VolumnBook**.

---

## 1. Local Application Log File

VolumnBook maintains a local log file of all database operations, exports, errors, and system events.

### Log Location:
```text
%APPDATA%\VolumnBook\logs\volumnbook.log
```

To view or export logs inside the application:
1. Open **Settings** on the sidebar.
2. Scroll to the **System Activity Log** section.
3. Review events or click **Export Log File** to save a text copy for IT technical support.

---

## 2. Common Issues & Solutions

### A. "Please enter a Case No."
- **Cause**: Case No is a required field for every volume record.
- **Solution**: Provide an official case identifier (e.g. `WP/2026/1042`).

### B. "Notice on Chronological Sequence" Warning
- **Cause**: Dates do not follow standard progression:
  `Judgement Date <= Draft Date <= Final Date <= Send to Section Date`.
- **Solution**: Verify the dates entered. If this was an exceptional administrative circumstance, you can still proceed and save the record.

### C. Excel or Word Export Fails
- **Cause**: The previous export file with the exact same name is currently opened and locked by Microsoft Excel or Microsoft Word.
- **Solution**: Close Microsoft Excel or Word and click the export button again.

### D. Database Restore Fails with "Integrity check failed"
- **Cause**: The selected file is corrupted, truncated, or from an incompatible source.
- **Solution**: VolumnBook deliberately refuses to restore invalid files to protect your system. Select a valid `.db` backup created by VolumnBook.

### E. Printer does not respond
- **Cause**: Physical printer is offline, powered off, or disconnected from Windows.
- **Solution**: Verify your Windows default printer is online in Windows Settings > Printers & Scanners. Alternatively, export to **PDF** and print later.

---

## 3. Contact & Support

When reporting an issue to your organization's IT department:
1. VolumnBook Version: `1.0.0`
2. Operating System version (e.g., Windows 11 Pro 64-bit)
3. Relevant error lines from `%APPDATA%\VolumnBook\logs\volumnbook.log`
