import { create } from 'zustand';

type Mode = 'single' | 'stack' | 'batch';

interface ModeState {
  mode: Mode;
  setMode: (mode: Mode) => void;
}

export const useModeStore = create<ModeState>((set) => ({
  mode: 'single',
  setMode: (mode) => set({ mode }),
}));
