# VolumnBook — End User Operating Guide

A comprehensive guide for office staff, court clerks, and administrators managing case and judgement volume records.

---

## 1. Interface Overview

- **Header / Titlebar**: Displays application title, system date/time in `dd-MM-yyyy HH:mm:ss`, offline status, and quick action buttons.
- **Left Sidebar**: Provides fast access to all 12 modules. Can be collapsed or expanded using the top menu icon.
- **Main Area**: Houses the active module (Data Grid, Entry Form, Reports, Search, etc.).
- **Status Bar**: Bottom bar displaying SQLite engine health, record count, and keyboard shortcuts.

---

## 2. Adding a New Volume Record

1. Click **New Entry** on the sidebar, or press <kbd>Ctrl + N</kbd>.
2. The next **Serial No** is automatically assigned and shown (e.g. `#1`).
3. Enter the **Case No** (e.g. `WP/2026/1042`). This field is required.
4. Enter or pick dates in `dd-MM-yyyy` format:
   - **Judgement Date**: Date judgement was delivered.
   - **Draft Date**: Date draft order was prepared.
   - **Final Date**: Date final order was finalized.
   - **Send to Section Date**: Date file was officially dispatched to the administrative section.
5. If dates are chronologically inconsistent, a gentle warning banner appears to review them.
6. Enter any **Remarks** (optional).
7. Click **Save Record** or press <kbd>Ctrl + S</kbd>.

---

## 3. Viewing and Managing Records (All Records)

1. Navigate to **All Records**.
2. **Search**: Use the quick search input to find records instantly by Serial No, Case No, or Remarks.
3. **Sort**: Click any column header (Serial No, Case No, Judgement Date, etc.) to sort ascending or descending.
4. **View**: Click the eye icon (<svg class="inline w-3 h-3" viewBox="0 0 24 24"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/></svg>) to view full details.
5. **Edit**: Click the edit pencil icon to modify fields and save updates.
6. **Delete**: Click the trash icon. A confirmation modal will appear requiring confirmation before permanent deletion.
7. **Print Record**: Click the printer icon to print a single record immediately.

---

## 4. Searching Records

1. Go to **Search** or press <kbd>Ctrl + F</kbd>.
2. **Global Search**: Type any keyword in the search box.
3. **Advanced Filters**: Click "Advanced Filters" to filter by:
   - Specific Case Number
   - Judgement Date Range (From / To)
   - Draft Date Range (From / To)
   - Final Date Range (From / To)
   - Send to Section Date Range (From / To)
   - Remarks keyword
4. The system updates the live result count: `Showing X of Y records`.
5. Click **Print Results** to print only the matching records.

---

## 5. Generating Reports

1. Click **Reports**.
2. Choose from the **11 Report Types**:
   - All Records
   - Daily Activity Report
   - Date Range Report
   - Case No Search Report
   - Judgement Date Report
   - Draft Date Report
   - Final Date Report
   - Send to Section Report
   - Pending Records Report
   - Completed Records Report
   - Custom Filtered Report
3. Filter parameters automatically adjust based on the selected report.
4. Preview the formatted document on screen.
5. Click **Print Report**, **PDF**, **DOCX**, or **XLS** to output the document.

---

## 6. Importing Data from CSV Files

1. Open **Import CSV** from the sidebar or press <kbd>Ctrl + I</kbd>.
2. **Step 1 - Select File**:
   - Drag & drop your `.csv`, `.tsv`, or `.txt` file, or click **Browse Local CSV File**.
   - Or click **Sample Template** to download a pre-formatted template with standard headers.
   - Or click **Load Demo Dataset** to test the import workflow instantly with built-in case records.
3. **Step 2 - Smart Column Mapping**:
   - The system automatically auto-detects standard columns (`Case No`, `Serial No`, `Judgement Date`, `Draft Date`, `Final Date`, `Send To Section Date`, `Remarks`).
   - Match or adjust column mappings using the dropdown selectors.
4. **Step 3 - Review & Validate**:
   - Review the live interactive preview table with color-coded status badges:
     - **Valid** (Green): Record is clean and ready to import.
     - **Duplicate** (Blue): Case No is repeated in the file or exists in the database.
     - **Warning** (Amber): Date progression or format notices.
     - **Error** (Red): Missing required Case No.
   - Filter rows using the interactive filter tabs (**All**, **Clean Valid**, **Duplicates**, **Warnings**, **Errors**).
   - Configure **Duplicate Data & Conflict Handling**:
     - *Append All (Allow Duplicates)* (Default): Imports all records. Repeated or existing Case Numbers are permitted and assigned unique serial numbers.
     - *Append New (Skip Duplicates)*: Inserts only new cases; existing Case Numbers are skipped.
     - *Merge & Update Existing*: Updates existing Case Numbers and inserts new ones.
     - *Clean & Replace*: Empties database (with automated safety backup) and imports fresh records.
     - *Allow duplicate data checkbox*: Toggle anytime to permit duplicate Case Numbers across import modes.
   - Choose whether to retain CSV serial numbers or re-calculate sequentially.
5. **Step 4 - Complete**:
   - Click **Confirm & Import**.
   - Review the execution summary (including Duplicates Allowed count) and jump directly to **All Records** or **Dashboard**.

---

## 7. Backing Up the Database

1. Open **Backup Database** or press <kbd>Ctrl + B</kbd>.
2. Click **Create Backup Now**.
3. A timestamped file is generated:
   ```text
   VolumnBook_Backup_2026-09-29_14-30-00.db
   ```
4. Save the file to your documents, external hard drive, or USB flash drive.

---

## 7. Restoring from a Backup

1. Open **Restore Database**.
2. Click the upload zone to browse for your `.db` backup file.
3. The system executes `PRAGMA integrity_check` to verify the backup file is valid and uncorrupted.
4. Confirm the warning dialog.
5. The active database is safely replaced and the records grid refreshes automatically.

---

## 8. Cleaning the Database

1. Open **Clean Database**.
2. Review the red warning banner.
3. Check "Automatically download a safety backup before purging records".
4. Click **Clean Database (Reset Records)**.
5. Confirm the action. Total record count will reset to 0, and the next serial number will start at #1.
