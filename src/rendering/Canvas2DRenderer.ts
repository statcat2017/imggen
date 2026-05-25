import type { FilterSettings } from "@/types";
import { runPipeline } from "@/rendering/pipeline";

const MAX_PREVIEW_DIMENSION = 1920;

export class Canvas2DRenderer {
  async render(
    source: ImageBitmap,
    settings: FilterSettings,
  ): Promise<ImageBitmap> {
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
    const imageData = ctx.getImageData(0, 0, targetW, targetH);

    const maxEdgeThickness = Math.min(settings.edgeThickness, 2);
    const cappedSettings = { ...settings, edgeThickness: maxEdgeThickness };

    const result = runPipeline(imageData, cappedSettings);

    ctx.putImageData(result, 0, 0);
    return canvas.transferToImageBitmap();
  }
}
