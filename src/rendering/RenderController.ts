import type { FilterSettings } from "@/types";

let requestId = 0;

export class RenderController {
  private rid = ++requestId;

  async renderPreview(image: ImageBitmap, canvas: HTMLCanvasElement) {
    void this.rid;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
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
