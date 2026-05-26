import { create } from "zustand";
import type { ExportSettings, ExportStatus } from "@/types";

type ExportStore = {
  exportImage: ((settings: ExportSettings) => Promise<void>) | null;
  status: ExportStatus;
  error: string | null;
  requestFocusExport: () => void;
  onFocusExport: (() => void) | null;
  setExportImage: (fn: ((settings: ExportSettings) => Promise<void>) | null) => void;
  setStatus: (status: ExportStatus) => void;
  setError: (error: string | null) => void;
  setOnFocusExport: (fn: (() => void) | null) => void;
};

export const useExportStore = create<ExportStore>((set, get) => ({
  exportImage: null,
  status: "idle",
  error: null,
  requestFocusExport: () => {
    get().onFocusExport?.();
  },
  onFocusExport: null,
  setExportImage: (fn) => set({ exportImage: fn }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),
  setOnFocusExport: (fn) => set({ onFocusExport: fn }),
}));
