import type { Renderer, RenderRequest, RenderResult } from "./Renderer";
import { Canvas2DRenderer } from "./Canvas2DRenderer";
import { RenderController } from "./RenderController";
import { WebGLRenderer } from "./WebGLRenderer";

export type { Renderer, RenderRequest, RenderResult };
export { Canvas2DRenderer, RenderController, WebGLRenderer };
export { MAX_PREVIEW_DIMENSION, MAX_EXPORT_DIMENSION, resolveExportDimensions, recalcAspectRatio } from "./Renderer";

export function createPreviewRenderer(): Renderer {
  try {
    return new WebGLRenderer();
  } catch {
    return new Canvas2DRenderer();
  }
}
