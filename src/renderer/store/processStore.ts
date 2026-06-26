import { create } from 'zustand';

export type ProcessPhase = 'idle' | 'processing' | 'done' | 'error' | 'cancelled';

interface ProcessState {
  phase: ProcessPhase;
  jobId: string | null;
  progress: number;        // 0-100
  speed: string | null;    // e.g. "2.3x"
  outputPath: string | null;
  error: string | null;

  startJob: (jobId: string) => void;
  setProgress: (pct: number, speed?: string) => void;
  finishJob: (outputPath: string) => void;
  failJob: (error: string) => void;
  cancelJob: () => void;
  reset: () => void;
}

export const useProcessStore = create<ProcessState>((set) => ({
  phase: 'idle',
  jobId: null,
  progress: 0,
  speed: null,
  outputPath: null,
  error: null,

  startJob: (jobId) => set({ phase: 'processing', jobId, progress: 0, speed: null, outputPath: null, error: null }),
  setProgress: (pct, speed) => set((s) => ({
    progress: typeof pct === 'number' && !isNaN(pct) ? pct : s.progress,
    speed: speed ?? s.speed,
  })),
  finishJob: (outputPath) => set({ phase: 'done', progress: 100, outputPath }),
  failJob: (error) => set({ phase: 'error', error }),
  cancelJob: () => set({ phase: 'cancelled' }),
  reset: () => set({ phase: 'idle', jobId: null, progress: 0, speed: null, outputPath: null, error: null }),
}));
