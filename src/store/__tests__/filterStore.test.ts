import { describe, it, expect, beforeEach } from "vitest";
import { useFilterStore, defaultFilterSettings } from "@/store/filterStore";

beforeEach(() => {
  localStorage.clear();
  useFilterStore.setState({ settings: { ...defaultFilterSettings } });
});

describe("filterStore", () => {
  it("starts with default settings matching Adventure Background preset", () => {
    const { settings } = useFilterStore.getState();
    expect(settings.colourLevels).toBe(6);
    expect(settings.edgeStrength).toBe(0.65);
    expect(settings.presetId).toBe("adventure-background");
  });

  it("update patches settings and sets presetId to null for non-matching values", () => {
    useFilterStore.getState().update({ colourLevels: 3 });
    const { settings } = useFilterStore.getState();
    expect(settings.colourLevels).toBe(3);
    expect(settings.presetId).toBe(null);
  });

  it("update restores presetId when settings match a built-in preset", () => {
    useFilterStore.getState().update({ colourLevels: 3 });
    useFilterStore.getState().update({ colourLevels: 6 });
    const { settings } = useFilterStore.getState();
    expect(settings.colourLevels).toBe(6);
    expect(settings.presetId).toBe("adventure-background");
  });

  it("applyPreset overwrites all fields atomically", () => {
    useFilterStore.getState().applyPreset("comic-ink");
    const { settings } = useFilterStore.getState();
    expect(settings.colourLevels).toBe(5);
    expect(settings.edgeStrength).toBe(0.9);
    expect(settings.presetId).toBe("comic-ink");
    expect(settings.basePresetId).toBe("comic-ink");
  });

  it("persists settings to localStorage on update", () => {
    useFilterStore.getState().update({ colourLevels: 8 });
    const raw = localStorage.getItem("imggen-filter-settings");
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!).colourLevels).toBe(8);
  });

  it("calls localStorage.getItem during initialization", () => {
    expect(localStorage.getItem).toHaveBeenCalledWith("imggen-filter-settings");
  });
});
