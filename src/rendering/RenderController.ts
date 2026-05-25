import type { FilterSettings } from "@/types";

let requestId = 0;

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

export class RenderController {
  private rid = ++requestId;

  async renderPreview(
    image: ImageBitmap,
    canvas: HTMLCanvasElement,
    zoom: number,
    panX: number,
    panY: number,
  ) {
    void this.rid;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    drawCheckerboard(ctx);

    ctx.save();
    ctx.translate(canvas.width / 2 + panX, canvas.height / 2 + panY);
    ctx.scale(zoom, zoom);
    ctx.drawImage(image, -image.width / 2, -image.height / 2);
    ctx.restore();
  }

  async renderExport(
    image: ImageBitmap,
    settings: FilterSettings,
    targetWidth: number,
    targetHeight: number,
  ) {
    void image;
    void settings;
    void targetWidth;
    void targetHeight;
  }
}
