import { create } from 'zustand';

export interface TrimRange {
  start: number; // seconds
  end: number;   // seconds
}

interface TrimState {
  // Per-file trim ranges, keyed by fileId.
  ranges: Record<string, TrimRange>;
  setRange: (fileId: string, range: TrimRange) => void;
  clearRange: (fileId: string) => void;
}

export const useTrimStore = create<TrimState>((set) => ({
  ranges: {},
  setRange: (fileId, range) => set((s) => ({ ranges: { ...s.ranges, [fileId]: range } })),
  clearRange: (fileId) => set((s) => {
    const next = { ...s.ranges };
    delete next[fileId];
    return { ranges: next };
  }),
}));
