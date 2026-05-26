import type { FilterSettings } from "@/types";
import type { Renderer } from "@/rendering/Renderer";
import { Canvas2DRenderer } from "@/rendering/Canvas2DRenderer";

let globalRenderId = 0;

function drawCheckerboard(ctx: CanvasRenderingContext2D) {
  const size = 8;
  const patternCanvas = document.createElement("canvas");
  patternCanvas.width = size * 2;
  patternCanvas.height = size * 2;
  const patternCtx = patternCanvas.getContext("2d");
  if (!patternCtx) return;
  patternCtx.fillStyle = "#1e1e2e";
  patternCtx.fillRect(0, 0, size * 2, size * 2);
  patternCtx.fillStyle = "#313244";
  patternCtx.fillRect(0, 0, size, size);
  patternCtx.fillRect(size, size, size, size);
  const pattern = ctx.createPattern(patternCanvas, "repeat");
  if (pattern) {
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }
}

function drawBitmap(
  ctx: CanvasRenderingContext2D,
  bitmap: ImageBitmap,
  w: number,
  h: number,
  zoom: number,
  panX: number,
  panY: number,
) {
  ctx.save();
  ctx.translate(w / 2 + panX, h / 2 + panY);
  ctx.scale(zoom, zoom);
  ctx.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);
  ctx.restore();
}

export class RenderController {
  private cachedSourceId = "";
  private cachedSettingsHash = "";
  private cachedBitmap: ImageBitmap | null = null;
  private renderer: Renderer;
  private fellBack = false;

  constructor(renderer?: Renderer) {
    this.renderer = renderer ?? new Canvas2DRenderer();
  }

  async renderPreview(
    image: ImageBitmap,
    canvas: HTMLCanvasElement,
    zoom: number,
    panX: number,
    panY: number,
    settings: FilterSettings | undefined,
    sourceId: string,
  ) {
    const currentRid = ++globalRenderId;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    drawCheckerboard(ctx);

    if (settings) {
      const settingsHash = JSON.stringify(settings);

      if (sourceId !== this.cachedSourceId || settingsHash !== this.cachedSettingsHash) {
        let result: { bitmap: ImageBitmap };
        try {
          result = await this.renderer.render({ source: image, sourceId, settings });
        } catch (err) {
          if (!this.fellBack) {
            console.warn("[RenderController] renderer failed, falling back to Canvas2D:", err);
            this.renderer.destroy();
            this.renderer = new Canvas2DRenderer();
            this.fellBack = true;
            result = await this.renderer.render({ source: image, sourceId, settings });
          } else {
            throw err;
          }
        }
        if (globalRenderId !== currentRid) {
          result.bitmap.close();
          return;
        }

        if (this.cachedBitmap) this.cachedBitmap.close();
        this.cachedSourceId = sourceId;
        this.cachedSettingsHash = settingsHash;
        this.cachedBitmap = result.bitmap;
      }

      drawBitmap(ctx, this.cachedBitmap!, w, h, zoom, panX, panY);
    } else {
      drawBitmap(ctx, image, w, h, zoom, panX, panY);
    }
  }

  async renderExport(
    image: ImageBitmap,
    settings: FilterSettings,
    targetWidth: number,
    targetHeight: number,
  ): Promise<ImageBitmap> {
    const result = await this.renderer.render({
      source: image,
      sourceId: "export",
      settings,
      exportDimensions: { width: targetWidth, height: targetHeight },
    });
    return result.bitmap;
  }

  getRenderer() {
    return this.renderer;
  }

  destroy() {
    if (this.cachedBitmap) {
      this.cachedBitmap.close();
      this.cachedBitmap = null;
    }
    this.renderer.destroy();
  }
}
