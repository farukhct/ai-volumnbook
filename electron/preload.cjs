/**
 * VolumnBook — Electron Preload Bridge
 * Enforces strict IPC boundaries with contextIsolation: true and nodeIntegration: false.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  appVersion: '1.0.0',

  // Database CRUD methods
  getRecords: (filters) => ipcRenderer.invoke('db:get-records', filters),
  getRecordById: (id) => ipcRenderer.invoke('db:get-record-by-id', id),
  addRecord: (record) => ipcRenderer.invoke('db:add-record', record),
  updateRecord: (id, updates) => ipcRenderer.invoke('db:update-record', id, updates),
  deleteRecord: (id) => ipcRenderer.invoke('db:delete-record', id),

  // Backup & Restore
  backupDatabase: () => ipcRenderer.invoke('db:backup'),
  restoreDatabase: (fileBuffer) => ipcRenderer.invoke('db:restore', fileBuffer),
  cleanDatabase: () => ipcRenderer.invoke('db:clean'),

  // System Printing & Window Actions
  printPage: (options) => ipcRenderer.invoke('window:print', options),
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),
});
