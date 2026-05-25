import type { Renderer, RenderRequest, RenderResult } from "./Renderer";
import { Canvas2DRenderer } from "./Canvas2DRenderer";
import { RenderController } from "./RenderController";
import { WebGLRenderer } from "./WebGLRenderer";

export type { Renderer, RenderRequest, RenderResult };
export { Canvas2DRenderer, RenderController, WebGLRenderer };

export function createPreviewRenderer(): Renderer {
  try {
    const testCanvas = new OffscreenCanvas(1, 1);
    const gl = testCanvas.getContext("webgl2");
    if (gl) {
      return new WebGLRenderer();
    }
  } catch {
    // WebGL init failed — fall back to Canvas 2D
  }
  return new Canvas2DRenderer();
}
