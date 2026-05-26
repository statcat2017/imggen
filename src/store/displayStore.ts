import { create } from "zustand";
import type { DisplayMode } from "@/types";

type ViewActions = {
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
};

type DisplayStore = {
  mode: DisplayMode;
  tempMode: DisplayMode | null;
  splitPosition: number;
  viewActions: ViewActions;
  setMode: (mode: DisplayMode) => void;
  setTempMode: (mode: DisplayMode | null) => void;
  setSplitPosition: (pos: number) => void;
  cycleMode: () => void;
  registerViewActions: (actions: ViewActions) => void;
};

const noop = () => {};

export const useDisplayStore = create<DisplayStore>((set, get) => ({
  mode: "processed",
  tempMode: null,
  splitPosition: 0.5,
  viewActions: { zoomIn: noop, zoomOut: noop, resetZoom: noop },

  setMode: (mode) => set({ mode, tempMode: null }),
  setTempMode: (tempMode) => set({ tempMode }),
  setSplitPosition: (splitPosition) => set({ splitPosition }),

  cycleMode: () => {
    const { mode } = get();
    const next: Record<DisplayMode, DisplayMode> = {
      processed: "original",
      original: "split",
      split: "processed",
    };
    set({ mode: next[mode] });
  },

  registerViewActions: (viewActions) => set({ viewActions }),
}));
