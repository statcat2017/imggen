import { create } from "zustand";
import { builtInPresets } from "@/presets/builtInPresets";
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

type PresetStore = {
  builtIn: FilterPreset[];
  custom: FilterPreset[];
  activePresetId: string;
  setActive: (id: string) => void;
  saveCustom: (preset: FilterPreset) => void;
  deleteCustom: (id: string) => void;
};

export const usePresetStore = create<PresetStore>((set) => ({
  builtIn: builtInPresets,
  custom: loadCustomPresets(),
  activePresetId: builtInPresets[0].id,

  setActive(id) {
    set({ activePresetId: id });
  },

  saveCustom(preset) {
    set((state) => {
      const next = [...state.custom.filter((p) => p.id !== preset.id), preset];
      try {
        localStorage.setItem("imggen-custom-presets", JSON.stringify(next));
      } catch {
        // ignore
      }
      return { custom: next, activePresetId: preset.id };
    });
  },

  deleteCustom(id) {
    set((state) => {
      const next = state.custom.filter((p) => p.id !== id);
      try {
        localStorage.setItem("imggen-custom-presets", JSON.stringify(next));
      } catch {
        // ignore
      }
      return { custom: next };
    });
  },
}));
