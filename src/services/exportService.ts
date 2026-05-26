import type { FilterSettings, ExportSettings } from "@/types";
import type { Renderer } from "@/rendering/Renderer";
import { resolveExportDimensions } from "@/rendering/Renderer";
import { generateExportFilename } from "@/services/filename";

function sharpenImageData(data: ImageData): ImageData {
  const w = data.width;
  const h = data.height;
  const input = data.data;
  const out = new Uint8ClampedArray(input.length);
  const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      let r = 0, g = 0, b = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const px = x + kx;
          const py = y + ky;
          if (px < 0 || px >= w || py < 0 || py >= h) continue;
          const i = (py * w + px) * 4;
          const k = kernel[(ky + 1) * 3 + (kx + 1)];
          r += input[i] * k;
          g += input[i + 1] * k;
          b += input[i + 2] * k;
        }
      }
      out[idx] = Math.min(255, Math.max(0, r));
      out[idx + 1] = Math.min(255, Math.max(0, g));
      out[idx + 2] = Math.min(255, Math.max(0, b));
      out[idx + 3] = input[idx + 3];
    }
  }
  return new ImageData(out, w, h);
}

export async function renderExport(
  renderer: Renderer,
  source: ImageBitmap,
  filterSettings: FilterSettings,
  exportSettings: ExportSettings,
): Promise<{ blob: Blob; capped: boolean }> {
  const { width: sourceW, height: sourceH } = source;

  const { width: exportW, height: exportH, capped } = resolveExportDimensions(
    sourceW, sourceH, exportSettings.resolution, exportSettings.customWidth, exportSettings.customHeight, exportSettings.aspectLock,
  );

  const result = await renderer.render({
    source,
    sourceId: "export",
    settings: filterSettings,
    exportDimensions: { width: exportW, height: exportH },
  });

  const encodeCanvas = new OffscreenCanvas(result.bitmap.width, result.bitmap.height);
  const ctx = encodeCanvas.getContext("2d");
  if (!ctx) throw new Error("Export: failed to get 2d context");

  if (exportSettings.format === "jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, encodeCanvas.width, encodeCanvas.height);
  }
  ctx.drawImage(result.bitmap, 0, 0);

  if (exportSettings.sharpen) {
    const imageData = ctx.getImageData(0, 0, encodeCanvas.width, encodeCanvas.height);
    const sharpened = sharpenImageData(imageData);
    ctx.putImageData(sharpened, 0, 0);
  }

  result.bitmap.close();

  const mimeType = exportSettings.format === "jpeg" ? "image/jpeg" : "image/png";
  const blob = await encodeCanvas.convertToBlob({
    type: mimeType,
    quality: exportSettings.format === "jpeg" ? exportSettings.jpegQuality : undefined,
  });

  return { blob, capped };
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportAndDownload(
  renderer: Renderer,
  source: ImageBitmap,
  filterSettings: FilterSettings,
  exportSettings: ExportSettings,
  originalName: string,
): Promise<void> {
  const { blob } = await renderExport(renderer, source, filterSettings, exportSettings);
  triggerDownload(blob, generateExportFilename(originalName, exportSettings.format));
}
