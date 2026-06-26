import { create } from 'zustand';

export interface RenderTask {
  id: string;
  fileName: string;
  status: 'pending' | 'processing' | 'done' | 'error' | 'cancelled';
  progress: number;
  speed?: string;
  outputPath?: string;
  error?: string;
}

interface RenderState {
  tasks: RenderTask[];
  addTask: (task: RenderTask) => void;
  updateTask: (id: string, update: Partial<RenderTask>) => void;
  removeTask: (id: string) => void;
  clearDone: () => void;
}

export const useRenderStore = create<RenderState>((set) => ({
  tasks: [],
  addTask: (task) => set((s) => ({ tasks: [...s.tasks, task] })),
  updateTask: (id, update) => set((s) => ({
    tasks: s.tasks.map(t => t.id === id ? { ...t, ...update } : t),
  })),
  removeTask: (id) => set((s) => ({ tasks: s.tasks.filter(t => t.id !== id) })),
  clearDone: () => set((s) => ({ tasks: s.tasks.filter(t => t.status !== 'done' && t.status !== 'error') })),
}));
