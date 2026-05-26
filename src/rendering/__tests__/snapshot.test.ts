import { describe, it, expect } from "vitest";
import { runPipeline } from "@/rendering/pipeline";
import { defaultFilterSettings } from "@/store/filterStore";
import { allFixtures, pixelDelta, computeChecksum, goldenChecksums } from "@/rendering/__tests__/fixtures";

describe("rendering invariants", () => {
  for (const { name, imageData } of allFixtures) {
    it(`adventure-background preset on ${name} produces correct dimensions`, () => {
      const result = runPipeline(imageData, defaultFilterSettings);
      expect(result.width).toBe(imageData.width);
      expect(result.height).toBe(imageData.height);
      expect(result.data.length).toBe(imageData.data.length);
    });

    it(`${name} output is deterministic (same settings → same result)`, () => {
      const a = runPipeline(imageData, defaultFilterSettings);
      const b = runPipeline(imageData, defaultFilterSettings);
      const delta = pixelDelta(a.data, b.data);
      expect(delta).toBe(0);
    });

    it(`${name} golden checksum matches expected baseline`, () => {
      const result = runPipeline(imageData, defaultFilterSettings);
      const hash = computeChecksum(result.data);
      expect(hash).toBe(goldenChecksums[name]);
    });
  }

  it("edgeThickness affects output", () => {
    const thin = runPipeline(allFixtures[0].imageData, { ...defaultFilterSettings, edgeThickness: 0 });
    const thick = runPipeline(allFixtures[0].imageData, { ...defaultFilterSettings, edgeThickness: 8 });
    const delta = pixelDelta(thin.data, thick.data);
    expect(delta).toBeGreaterThan(0);
  });

  it("different presets produce different results", () => {
    const adventure = runPipeline(allFixtures[0].imageData, { ...defaultFilterSettings, presetId: "adventure-background" });
    const comic = runPipeline(allFixtures[0].imageData, { ...defaultFilterSettings, colourLevels: 5, edgeStrength: 0.9, edgeThickness: 3, edgeThreshold: 0.15, smoothing: 0.1, contrast: 1.4, saturation: 1.1, shadowBias: 0.1, lineColour: "#0a0a0a", presetId: "comic-ink" });
    const delta = pixelDelta(adventure.data, comic.data);
    expect(delta).toBeGreaterThan(0);
  });
});
