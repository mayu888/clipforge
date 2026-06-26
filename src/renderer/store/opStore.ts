import { create } from 'zustand';

interface FileConfig {
  opId: string | null;
  params: Record<string, any>;
}

interface OpState {
  selectedOpId: string | null;
  params: Record<string, any>;
  fileConfigs: Record<string, FileConfig>;
  selectOp: (opId: string | null) => void;
  updateParam: (key: string, value: any) => void;
  resetParams: () => void;
  saveFileConfig: (fileId: string) => void;
  restoreFileConfig: (fileId: string) => void;
}

export const useOpStore = create<OpState>((set, get) => ({
  selectedOpId: null,
  params: {},
  fileConfigs: {},
  selectOp: (opId) => set({ selectedOpId: opId, params: {} }),
  updateParam: (key, value) => set((s) => ({ params: { ...s.params, [key]: value } })),
  resetParams: () => set({ params: {} }),
  saveFileConfig: (fileId) => {
    const { selectedOpId, params } = get();
    set((s) => ({
      fileConfigs: { ...s.fileConfigs, [fileId]: { opId: selectedOpId, params } },
    }));
  },
  restoreFileConfig: (fileId) => {
    const config = get().fileConfigs[fileId];
    if (config) {
      set({ selectedOpId: config.opId, params: config.params });
    } else {
      set({ selectedOpId: null, params: {} });
    }
  },
}));
