import { smooth, colorCorrect, posterize, edgeDetect, composite } from "@/rendering/pipeline";
import type { Renderer, RenderRequest, RenderResult } from "@/rendering/Renderer";

const MAX_PREVIEW_DIMENSION = 1920;

type PassCacheKey = string;

type PassCache = {
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

export class Canvas2DRenderer implements Renderer {
  private passCache: PassCache | null = null;

  async render(request: RenderRequest): Promise<RenderResult> {
    const { source, sourceId, settings } = request;

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
      this.passCache &&
      this.passCache.sourceId === sourceId &&
      this.passCache.sourceWidth === source.width &&
      this.passCache.sourceHeight === source.height;

    const smoothedKey = hashSmoothed(sourceId, settings.smoothing);
    let smoothed: ImageData;
    if (
      sameSource &&
      this.passCache?.smoothedKey === smoothedKey &&
      this.passCache.smoothedData
    ) {
      smoothed = this.passCache.smoothedData;
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
      this.passCache?.posterizedKey === posterizedKey &&
      this.passCache.posterizedData
    ) {
      posterized = this.passCache.posterizedData;
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
      this.passCache?.edgeMaskKey === edgeMaskKey &&
      this.passCache.edgeMaskData
    ) {
      edgeMask = this.passCache.edgeMaskData;
    } else {
      edgeMask = edgeDetect(posterized, settings.edgeThreshold, settings.edgeStrength);
    }

    const maxEdgeThickness = Math.min(settings.edgeThickness, 2);
    const result = composite(posterized, edgeMask, settings.lineColour, maxEdgeThickness);

    ctx.putImageData(result, 0, 0);

    this.passCache = {
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

    return { bitmap: canvas.transferToImageBitmap() };
  }

  destroy() {
    this.passCache = null;
  }
}
