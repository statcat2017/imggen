import type { FilterSettings } from "@/types";
import { smooth, colorCorrect, posterize, edgeDetect, composite } from "@/rendering/pipeline";

const MAX_PREVIEW_DIMENSION = 1920;

export type PassCacheKey = string;

export type PassCache = {
  sourceId: string;
  sourceWidth: number;
  sourceHeight: number;
  smoothedKey: PassCacheKey;
  smoothedData: ImageData | null;
  posterizedKey: PassCacheKey;
  posterizedData: ImageData | null;
  edgeMaskKey: PassCacheKey;
  edgeMaskData: ImageData | null;
};

function hashSmoothed(sourceId: string, smoothing: number): PassCacheKey {
  return `${sourceId}-smooth-${smoothing}`;
}

function hashPosterized(
  sourceId: string,
  smoothing: number,
  colourLevels: number,
  contrast: number,
  saturation: number,
  shadowBias: number,
): PassCacheKey {
  return `${sourceId}-post-${smoothing}-${colourLevels}-${contrast}-${saturation}-${shadowBias}`;
}

function hashEdgeMask(
  sourceId: string,
  smoothing: number,
  colourLevels: number,
  contrast: number,
  saturation: number,
  shadowBias: number,
  edgeThreshold: number,
  edgeStrength: number,
): PassCacheKey {
  return `${sourceId}-edge-${smoothing}-${colourLevels}-${contrast}-${saturation}-${shadowBias}-${edgeThreshold}-${edgeStrength}`;
}

export class Canvas2DRenderer {
  async render(
    source: ImageBitmap,
    settings: FilterSettings,
    passCache: PassCache | null,
    sourceId: string,
  ): Promise<{ bitmap: ImageBitmap; cache: PassCache }> {
    const scale = Math.min(
      1,
      MAX_PREVIEW_DIMENSION / Math.max(source.width, source.height),
    );
    const targetW = Math.round(source.width * scale);
    const targetH = Math.round(source.height * scale);

    const canvas = new OffscreenCanvas(targetW, targetH);
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("Canvas2DRenderer: failed to get 2d context");

    ctx.drawImage(source, 0, 0, targetW, targetH);
    const sourceImageData = ctx.getImageData(0, 0, targetW, targetH);

    const sameSource =
      passCache &&
      passCache.sourceId === sourceId &&
      passCache.sourceWidth === source.width &&
      passCache.sourceHeight === source.height;

    const smoothedKey = hashSmoothed(sourceId, settings.smoothing);
    let smoothed: ImageData;
    if (
      sameSource &&
      passCache?.smoothedKey === smoothedKey &&
      passCache.smoothedData
    ) {
      smoothed = passCache.smoothedData;
    } else {
      smoothed = smooth(sourceImageData, settings.smoothing);
    }

    const posterizedKey = hashPosterized(
      sourceId,
      settings.smoothing,
      settings.colourLevels,
      settings.contrast,
      settings.saturation,
      settings.shadowBias,
    );
    let posterized: ImageData;
    if (
      sameSource &&
      passCache?.posterizedKey === posterizedKey &&
      passCache.posterizedData
    ) {
      posterized = passCache.posterizedData;
    } else {
      const corrected = colorCorrect(
        smoothed,
        settings.contrast,
        settings.saturation,
        settings.shadowBias,
      );
      posterized = posterize(corrected, settings.colourLevels);
    }

    const edgeMaskKey = hashEdgeMask(
      sourceId,
      settings.smoothing,
      settings.colourLevels,
      settings.contrast,
      settings.saturation,
      settings.shadowBias,
      settings.edgeThreshold,
      settings.edgeStrength,
    );
    let edgeMask: ImageData;
    if (
      sameSource &&
      passCache?.edgeMaskKey === edgeMaskKey &&
      passCache.edgeMaskData
    ) {
      edgeMask = passCache.edgeMaskData;
    } else {
      edgeMask = edgeDetect(posterized, settings.edgeThreshold, settings.edgeStrength);
    }

    const maxEdgeThickness = Math.min(settings.edgeThickness, 2);
    const result = composite(posterized, edgeMask, settings.lineColour, maxEdgeThickness);

    ctx.putImageData(result, 0, 0);

    const cache: PassCache = {
      sourceId,
      sourceWidth: source.width,
      sourceHeight: source.height,
      smoothedKey,
      smoothedData: smoothed,
      posterizedKey,
      posterizedData: posterized,
      edgeMaskKey,
      edgeMaskData: edgeMask,
    };

    return { bitmap: canvas.transferToImageBitmap(), cache };
  }
}
