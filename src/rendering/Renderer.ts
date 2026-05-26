import type { FilterSettings } from "@/types";

export type RenderRequest = {
  source: ImageBitmap;
  sourceId: string;
  settings: FilterSettings;
  exportDimensions?: { width: number; height: number };
};

export type RenderResult = {
  bitmap: ImageBitmap;
};

export interface Renderer {
  render(request: RenderRequest): Promise<RenderResult>;
  destroy(): void;
}

export const MAX_EXPORT_DIMENSION = 4096;
export const MAX_PREVIEW_DIMENSION = 1920;

export function resolveExportDimensions(
  sourceWidth: number,
  sourceHeight: number,
  resolution: "original" | "preview" | "custom",
  customWidth: number,
  customHeight: number,
  _aspectLock: boolean,
): { width: number; height: number; capped: boolean } {
  let w: number;
  let h: number;

  switch (resolution) {
    case "original":
      w = sourceWidth;
      h = sourceHeight;
      break;
    case "preview": {
      const scale = Math.min(1, MAX_PREVIEW_DIMENSION / Math.max(sourceWidth, sourceHeight));
      w = Math.round(sourceWidth * scale);
      h = Math.round(sourceHeight * scale);
      break;
    }
    case "custom":
      w = customWidth;
      h = customHeight;
      break;
  }

  const capped = Math.max(w, h) > MAX_EXPORT_DIMENSION;
  if (capped) {
    const scale = MAX_EXPORT_DIMENSION / Math.max(w, h);
    w = Math.round(w * scale);
    h = Math.round(h * scale);
  }

  return { width: Math.max(1, w), height: Math.max(1, h), capped };
}

export function recalcAspectRatio(
  changed: "width" | "height",
  value: number,
  other: number,
  sourceWidth: number,
  sourceHeight: number,
): number {
  if (sourceWidth <= 0 || sourceHeight <= 0) return other;
  const ratio = sourceWidth / sourceHeight;
  if (changed === "width") {
    return Math.round(value / ratio);
  }
  return Math.round(value * ratio);
}
