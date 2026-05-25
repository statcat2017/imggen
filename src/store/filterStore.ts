import { create } from "zustand";
import { builtInPresets } from "@/presets/builtInPresets";
import type { FilterSettings } from "@/types";

export const defaultFilterSettings: FilterSettings = {
  presetId: "adventure-background",
  colourLevels: 6,
  edgeStrength: 0.65,
  edgeThickness: 1.5,
  edgeThreshold: 0.25,
  smoothing: 0.35,
  contrast: 1.1,
  saturation: 1.15,
  shadowBias: 0.0,
  lineColour: "#111111",
  preserveBackground: true,
  preserveTransparency: true,
};

function loadPersistedSettings(): FilterSettings {
  try {
    const raw = localStorage.getItem("imggen-filter-settings");
    if (raw) return { ...defaultFilterSettings, ...JSON.parse(raw) };
  } catch {
    // corrupted data — fall back to defaults
  }
  return { ...defaultFilterSettings };
}

type FilterStore = {
  settings: FilterSettings;
  update: (patch: Partial<FilterSettings>) => void;
  reset: () => void;
  applyPreset: (presetId: string) => void;
};

export const useFilterStore = create<FilterStore>((set, get) => ({
  settings: loadPersistedSettings(),

  update(patch) {
    set((state) => {
      const next = { ...state.settings, ...patch, presetId: "custom" };
      try {
        localStorage.setItem("imggen-filter-settings", JSON.stringify(next));
      } catch {
        // ignore
      }
      return { settings: next };
    });
  },

  reset() {
    const preset = builtInPresets.find((p) => p.id === get().settings.presetId);
    const next = preset
      ? { ...preset.settings, presetId: preset.id }
      : { ...defaultFilterSettings };
    set({ settings: next });
    try {
      localStorage.setItem("imggen-filter-settings", JSON.stringify(next));
    } catch {
      // ignore
    }
  },

  applyPreset(presetId) {
    const preset = builtInPresets.find((p) => p.id === presetId);
    if (!preset) return;
    const next = { ...preset.settings, presetId };
    set({ settings: next });
    try {
      localStorage.setItem("imggen-filter-settings", JSON.stringify(next));
    } catch {
      // ignore
    }
  },
}));
