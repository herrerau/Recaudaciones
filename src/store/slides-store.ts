import { create } from "zustand";

interface SlidesState {
  current: number;
  total: number;
  autoPlay: boolean;
  next: () => void;
  prev: () => void;
  goTo: (index: number) => void;
  setTotal: (total: number) => void;
  toggleAutoPlay: () => void;
  setAutoPlay: (play: boolean) => void;
}

export const useSlidesStore = create<SlidesState>((set) => ({
  current: 0,
  total: 0,
  autoPlay: true,
  next: () =>
    set((state) => ({
      current: state.total > 0 ? (state.current + 1) % state.total : 0,
    })),
  prev: () =>
    set((state) => ({
      current:
        state.total > 0
          ? (state.current - 1 + state.total) % state.total
          : 0,
    })),
  goTo: (index) => set({ current: index }),
  setTotal: (total) => set({ total }),
  toggleAutoPlay: () => set((state) => ({ autoPlay: !state.autoPlay })),
  setAutoPlay: (play) => set({ autoPlay: play }),
}));
