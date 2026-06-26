import { create } from 'zustand';
import type { MediaFile } from '../lib/ipc';

interface MediaState {
  files: MediaFile[];
  selectedFileId: string | null;
  durations: Record<string, number>; // fileId → seconds
  addFiles: (files: MediaFile[]) => void;
  removeFile: (id: string) => void;
  selectFile: (id: string | null) => void;
  setDuration: (id: string, seconds: number) => void;
  clearAll: () => void;
}

export const useMediaStore = create<MediaState>((set) => ({
  files: [],
  selectedFileId: null,
  durations: {},
  addFiles: (files) => set((s) => ({
    files: [...s.files, ...files],
    selectedFileId: s.selectedFileId ?? files[0]?.id ?? null,
  })),
  removeFile: (id) => set((s) => ({
    files: s.files.filter(f => f.id !== id),
    selectedFileId: s.selectedFileId === id ? null : s.selectedFileId,
  })),
  selectFile: (id) => set({ selectedFileId: id }),
  setDuration: (id, seconds) => set((s) => ({ durations: { ...s.durations, [id]: seconds } })),
  clearAll: () => set({ files: [], selectedFileId: null, durations: {} }),
}));
