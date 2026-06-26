import { create } from 'zustand';

export interface StackItem {
  id: string;
  opId: string;
  params: Record<string, any>;
}

interface StackState {
  stack: StackItem[];
  addToStack: (opId: string, params: Record<string, any>) => void;
  removeFromStack: (id: string) => void;
  reorderStack: (fromIndex: number, toIndex: number) => void;
  clearStack: () => void;
}

let stackIdCounter = 0;

export const useStackStore = create<StackState>((set) => ({
  stack: [],
  addToStack: (opId, params) => set((s) => ({
    stack: [...s.stack, { id: `stack-${++stackIdCounter}`, opId, params: { ...params } }],
  })),
  removeFromStack: (id) => set((s) => ({
    stack: s.stack.filter(item => item.id !== id),
  })),
  reorderStack: (fromIndex, toIndex) => set((s) => {
    const arr = [...s.stack];
    const [removed] = arr.splice(fromIndex, 1);
    arr.splice(toIndex, 0, removed);
    return { stack: arr };
  }),
  clearStack: () => set({ stack: [] }),
}));
