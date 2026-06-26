import { create } from 'zustand';

export type LogLevel = 'info' | 'success' | 'error' | 'warn';

export interface LogEntry {
  id: number;
  timestamp: string;
  level: LogLevel;
  message: string;
}

interface LogState {
  logs: LogEntry[];
  addLog: (message: string, level?: LogLevel) => void;
  clearLogs: () => void;
}

let logIdCounter = 0;

export const useLogStore = create<LogState>((set) => ({
  logs: [],
  addLog: (message, level = 'info') => set((s) => ({
    logs: [...s.logs, {
      id: ++logIdCounter,
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
    }],
  })),
  clearLogs: () => set({ logs: [] }),
}));
