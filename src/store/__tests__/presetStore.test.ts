import { describe, it, expect, beforeEach } from "vitest";
import { usePresetStore } from "@/store/presetStore";
import type { FilterPreset } from "@/types";

function makePreset(id: string, name: string): FilterPreset {
  return {
    id,
    name,
    builtIn: false,
    settings: {
      presetId: null,
      basePresetId: null,
      colourLevels: 6,
      edgeStrength: 0.5,
      edgeThickness: 1,
      edgeThreshold: 0.25,
      smoothing: 0.3,
      contrast: 1,
      saturation: 1,
      shadowBias: 0,
      lineColour: "#000000",
      preserveBackground: false,
      preserveTransparency: true,
    },
  };
}

beforeEach(() => {
  localStorage.clear();
  usePresetStore.setState({ custom: [] });
});

describe("presetStore", () => {
  it("starts with no custom presets", () => {
    expect(usePresetStore.getState().custom).toEqual([]);
  });

  it("saveCustom adds a preset", () => {
    const preset = makePreset("p1", "My Preset");
    usePresetStore.getState().saveCustom(preset);
    expect(usePresetStore.getState().custom).toHaveLength(1);
    expect(usePresetStore.getState().custom[0].name).toBe("My Preset");
  });

  it("saveCustom replaces existing preset with same id", () => {
    const preset = makePreset("p1", "My Preset");
    usePresetStore.getState().saveCustom(preset);
    const updated = { ...preset, name: "Updated" };
    usePresetStore.getState().saveCustom(updated);
    expect(usePresetStore.getState().custom).toHaveLength(1);
    expect(usePresetStore.getState().custom[0].name).toBe("Updated");
  });

  it("deleteCustom removes a preset", () => {
    const preset = makePreset("p1", "My Preset");
    usePresetStore.getState().saveCustom(preset);
    usePresetStore.getState().deleteCustom("p1");
    expect(usePresetStore.getState().custom).toHaveLength(0);
  });

  it("persists custom presets to localStorage", () => {
    const preset = makePreset("p1", "My Preset");
    usePresetStore.getState().saveCustom(preset);
    const raw = localStorage.getItem("imggen-custom-presets");
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].name).toBe("My Preset");
  });
});
