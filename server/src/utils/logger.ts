// server/src/utils/logger.ts
import fs from 'fs';
import path from 'path';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  event?: string;
  requestId?: string;
  userId?: string;
  role?: string;
  route?: string;
  method?: string;
  statusCode?: number;
  durationMs?: number;
  message: string;
  errorCode?: string;
  details?: any;
}

class Logger {
  private level: LogLevel;
  private logDir: string;
  private logFile: string;

  constructor() {
    this.level = (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO;
    this.logDir = path.resolve(process.cwd(), 'logs');
    this.logFile = path.join(this.logDir, 'app.log');

    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  private formatEntry(entry: LogEntry): string {
    if (process.env.NODE_ENV === 'production') {
      return JSON.stringify(entry);
    }
    
    // Pretty print for development
    const color = this.getLevelColor(entry.level);
    const reset = '\x1b[0m';
    const time = new Date(entry.timestamp).toLocaleTimeString();
    let msg = `[${time}] ${color}${entry.level}${reset}: ${entry.message}`;
    
    if (entry.event) msg = `${msg} [${entry.event}]`;
    if (entry.requestId) msg = `${msg} (req:${entry.requestId})`;
    if (entry.route) msg = `${msg} ${entry.method} ${entry.route} ${entry.statusCode} ${entry.durationMs}ms`;
    
    return msg;
  }

  private getLevelColor(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG: return '\x1b[36m'; // Cyan
      case LogLevel.INFO: return '\x1b[32m';  // Green
      case LogLevel.WARN: return '\x1b[33m';  // Yellow
      case LogLevel.ERROR: return '\x1b[31m'; // Red
      default: return '\x1b[0m';
    }
  }

  private log(level: LogLevel, message: string, data: Partial<LogEntry> = {}) {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...data,
    };

    const formatted = this.formatEntry(entry);
    
    if (level === LogLevel.ERROR) {
      console.error(formatted);
    } else if (level === LogLevel.WARN) {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }

    // Write to file
    try {
      fs.appendFileSync(this.logFile, formatted + '\n');
    } catch (err) {
      console.error('Failed to write to log file:', err);
    }
  }

  debug(message: string, data?: Partial<LogEntry>) {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: Partial<LogEntry>) {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: Partial<LogEntry>) {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string, error?: any, data?: Partial<LogEntry>) {
    const details = error instanceof Error ? { 
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    } : error;

    this.log(LogLevel.ERROR, message, { ...data, details });
  }
}

export const logger = new Logger();
