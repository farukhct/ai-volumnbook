# VolumnBook — Windows Installation Guide

This document describes how to install and set up **VolumnBook** on a target Windows computer without internet connectivity.

---

## 1. System Requirements

- **Operating System**: Microsoft Windows 10, Windows 11, or Windows Server (64-bit).
- **Processor**: Intel Core i3 or equivalent (x64 architecture).
- **RAM**: Minimum 4 GB (8 GB recommended for large record sets).
- **Disk Space**: 500 MB free hard drive space.
- **Prerequisites**: **NONE**. Node.js, npm, SQL Server, and internet access are **NOT required** on the client computer.

---

## 2. Installation via Windows Installer (Recommended)

1. Obtain the installer executable:
   ```text
   VolumnBook-Setup-1.0.0.exe
   ```
2. Double-click `VolumnBook-Setup-1.0.0.exe`.
3. If prompted by Windows SmartScreen, click **More Info** followed by **Run Anyway**.
4. In the installation wizard:
   - Select installation directory (Default: `C:\Program Files\VolumnBook`).
   - Choose whether to create a **Desktop Shortcut**.
   - Ensure **Start Menu Shortcut** is checked.
5. Click **Install**.
6. When complete, leave **Run VolumnBook** checked and click **Finish**.

---

## 3. Portable Version Execution

If using the portable release (`VolumnBook-Portable-1.0.0.exe`):
1. Copy `VolumnBook-Portable-1.0.0.exe` to any folder or USB flash drive.
2. Double-click the file to execute immediately.
3. No installation or administrative privileges required.

---

## 4. First Launch Verification

When VolumnBook opens for the first time:
- The local SQLite database (`VolumnBook.db`) is automatically initialized in `%APPDATA%\VolumnBook\data\`.
- The database contains **ZERO records**. No dummy data or fake records are inserted.
- The status bar at the bottom will display:
  `Database: Connected (VolumnBook.db) | Records: 0 | 100% Offline`.

---

## 5. Uninstallation

1. Open Windows **Settings** > **Apps** > **Installed apps**.
2. Locate **VolumnBook**.
3. Click the three dots and choose **Uninstall**.
4. Follow the uninstaller prompts.
5. *Note: Your database records and backups in `%APPDATA%\VolumnBook\` remain intact by default to prevent accidental data loss. You can back them up or delete them manually.*
