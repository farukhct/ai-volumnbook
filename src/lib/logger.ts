/**
 * VolumnBook — Local Application Logger
 * Logs system events, database transactions, backups, restores, exports, and errors.
 */

import { LogEntry } from '../types';
import { formatFullDateTime } from './dateUtils';

const LOG_STORAGE_KEY = 'volumnbook_app_logs';
const MAX_LOG_ENTRIES = 500;

class AppLogger {
  private logs: LogEntry[] = [];

  constructor() {
    this.loadLogs();
    this.info('SYSTEM', 'VolumnBook logging service initialized.');
  }

  private loadLogs() {
    try {
      const stored = localStorage.getItem(LOG_STORAGE_KEY);
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch {
      this.logs = [];
    }
  }

  private persistLogs() {
    try {
      if (this.logs.length > MAX_LOG_ENTRIES) {
        this.logs = this.logs.slice(-MAX_LOG_ENTRIES);
      }
      localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(this.logs));
    } catch (e) {
      console.error('Failed to persist logs:', e);
    }
  }

  private log(level: LogEntry['level'], category: LogEntry['category'], message: string) {
    const entry: LogEntry = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: formatFullDateTime(new Date()),
      level,
      category,
      message,
    };
    this.logs.push(entry);
    this.persistLogs();

    // Also output to dev console
    if (level === 'ERROR') {
      console.error(`[${entry.timestamp}] [${category}] ${message}`);
    } else if (level === 'WARN') {
      console.warn(`[${entry.timestamp}] [${category}] ${message}`);
    } else {
      console.log(`[${entry.timestamp}] [${category}] ${message}`);
    }
  }

  public info(category: LogEntry['category'], message: string) {
    this.log('INFO', category, message);
  }

  public warn(category: LogEntry['category'], message: string) {
    this.log('WARN', category, message);
  }

  public error(category: LogEntry['category'], message: string) {
    this.log('ERROR', category, message);
  }

  public getLogs(): LogEntry[] {
    return [...this.logs].reverse();
  }

  public clearLogs() {
    this.logs = [];
    localStorage.removeItem(LOG_STORAGE_KEY);
    this.info('SYSTEM', 'Application log file cleared.');
  }

  public exportLogFileContent(): string {
    return this.logs
      .map((l) => `[${l.timestamp}] [${l.level.padEnd(5)}] [${l.category.padEnd(8)}] ${l.message}`)
      .join('\n');
  }
}

export const logger = new AppLogger();
