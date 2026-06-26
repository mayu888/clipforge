import { create } from 'zustand';
import type { MediaFile } from '../lib/ipc';

export type BatchStatus = 'pending' | 'processing' | 'done' | 'error';

export interface BatchItem {
  id: string;
  file: MediaFile;
  status: BatchStatus;
  progress: number;
  error?: string;
  outputPath?: string;
}

interface BatchState {
  queue: BatchItem[];
  enqueue: (files: MediaFile[]) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, update: Partial<BatchItem>) => void;
  clearDone: () => void;
  clearAll: () => void;
}

let batchIdCounter = 0;

export const useBatchStore = create<BatchState>((set) => ({
  queue: [],
  enqueue: (files) => set((s) => ({
    queue: [
      ...s.queue,
      ...files.map(f => ({
        id: `batch-${++batchIdCounter}`,
        file: f,
        status: 'pending' as BatchStatus,
        progress: 0,
      })),
    ],
  })),
  removeItem: (id) => set((s) => ({
    queue: s.queue.filter(item => item.id !== id),
  })),
  updateItem: (id, update) => set((s) => ({
    queue: s.queue.map(item => item.id === id ? { ...item, ...update } : item),
  })),
  clearDone: () => set((s) => ({
    queue: s.queue.filter(item => item.status !== 'done'),
  })),
  clearAll: () => set({ queue: [] }),
}));
