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
    if (raw) {
      const loaded = { ...defaultFilterSettings, ...JSON.parse(raw) };
      const matchingPreset = builtInPresets.find((p) => settingsMatchPreset(loaded, p.id));
      return { ...loaded, presetId: matchingPreset?.id ?? null };
    }
  } catch {
    // corrupted data — fall back to defaults
  }
  return { ...defaultFilterSettings };
}

function settingsMatchPreset(settings: FilterSettings, presetId: string): boolean {
  const preset = builtInPresets.find((p) => p.id === presetId);
  if (!preset) return false;
  const { presetId: _, ...settingsWithoutId } = settings;
  const { presetId: __, ...presetWithoutId } = preset.settings;
  return JSON.stringify(settingsWithoutId) === JSON.stringify(presetWithoutId);
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
      const next = { ...state.settings, ...patch };
      let presetId: string | null = null;
      for (const preset of builtInPresets) {
        if (settingsMatchPreset(next, preset.id)) {
          presetId = preset.id;
          break;
        }
      }
      const finalSettings = { ...next, presetId };
      try {
        localStorage.setItem("imggen-filter-settings", JSON.stringify(finalSettings));
      } catch {
        // ignore
      }
      return { settings: finalSettings };
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
