/**
 * VolumnBook — Electron Main Process
 * Case & Judgement Volume Management System
 * Production offline desktop application driver.
 */

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
let dbInstance = null;

// Determine storage paths in Windows %APPDATA%\VolumnBook
const userDataPath = app.getPath('userData');
const appDataDirs = {
  data: path.join(userDataPath, 'data'),
  backups: path.join(userDataPath, 'backups'),
  logs: path.join(userDataPath, 'logs'),
  exports: path.join(userDataPath, 'exports'),
};

// Ensure all application data directories exist
Object.values(appDataDirs).forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const dbPath = path.join(appDataDirs.data, 'VolumnBook.db');
const logFile = path.join(appDataDirs.logs, 'volumnbook.log');

function appendLog(category, message, level = 'INFO') {
  const line = `[${new Date().toISOString()}] [${level}] [${category}] ${message}\n`;
  try {
    fs.appendFileSync(logFile, line, 'utf8');
  } catch (e) {
    console.error('Failed writing to log file:', e);
  }
}

appendLog('SYSTEM', 'VolumnBook Electron runtime starting.');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    title: 'VolumnBook — Case & Judgement Volume Management System',
    backgroundColor: '#0f172a',
    show: false,
    frame: true,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    appendLog('SYSTEM', 'MainWindow shown to user.');
  });

  // Load production build or dev server
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (isDev && process.env.ELECTRON_START_URL) {
    mainWindow.loadURL(process.env.ELECTRON_START_URL);
  } else {
    const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
    if (fs.existsSync(indexPath)) {
      mainWindow.loadFile(indexPath);
    } else {
      mainWindow.loadURL('http://localhost:3000');
    }
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Window control IPC handlers
ipcMain.on('window:minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window:maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window:close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('window:print', async (event, options) => {
  if (!mainWindow) return;
  return new Promise((resolve, reject) => {
    mainWindow.webContents.print(
      {
        silent: false,
        printBackground: true,
        landscape: !!options?.landscape,
        margins: { marginType: 'custom', top: 0.4, bottom: 0.4, left: 0.4, right: 0.4 },
      },
      (success, failureReason) => {
        if (!success) {
          appendLog('PRINT', `Printing failed: ${failureReason}`, 'WARN');
          reject(new Error(failureReason));
        } else {
          appendLog('PRINT', 'Printed document successfully.');
          resolve();
        }
      }
    );
  });
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  appendLog('SYSTEM', 'Application closing.');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
