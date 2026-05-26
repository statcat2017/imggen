import { create } from "zustand";
import type { FilterPreset } from "@/types";

function loadCustomPresets(): FilterPreset[] {
  try {
    const raw = localStorage.getItem("imggen-custom-presets");
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return [];
}

function persistCustom(custom: FilterPreset[]): void {
  try {
    localStorage.setItem("imggen-custom-presets", JSON.stringify(custom));
  } catch {
    // ignore
  }
}

type PresetStore = {
  custom: FilterPreset[];
  saveCustom: (preset: FilterPreset) => void;
  renameCustom: (id: string, name: string) => void;
  deleteCustom: (id: string) => void;
  exportCustom: () => string;
  importCustom: (json: string) => number;
};

export const usePresetStore = create<PresetStore>((set) => ({
  custom: loadCustomPresets(),

  saveCustom(preset) {
    set((state) => {
      const next = [...state.custom.filter((p) => p.id !== preset.id), preset];
      persistCustom(next);
      return { custom: next };
    });
  },

  renameCustom(id, name) {
    set((state) => {
      const next = state.custom.map((p) => (p.id === id ? { ...p, name } : p));
      persistCustom(next);
      return { custom: next };
    });
  },

  deleteCustom(id) {
    set((state) => {
      const next = state.custom.filter((p) => p.id !== id);
      persistCustom(next);
      return { custom: next };
    });
  },

  exportCustom() {
    return JSON.stringify(loadCustomPresets(), null, 2);
  },

  importCustom(json) {
    try {
      const imported: FilterPreset[] = JSON.parse(json);
      const existingIds = new Set(loadCustomPresets().map((p) => p.id));
      const newPresets = imported.filter((p) => !existingIds.has(p.id));
      const merged = [...loadCustomPresets(), ...newPresets];
      persistCustom(merged);
      set({ custom: merged });
      return newPresets.length;
    } catch {
      return 0;
    }
  },
}));
