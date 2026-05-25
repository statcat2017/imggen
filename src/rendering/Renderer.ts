import type { FilterSettings } from "@/types";

export type RenderRequest = {
  source: ImageBitmap;
  sourceId: string;
  settings: FilterSettings;
};

export type RenderResult = {
  bitmap: ImageBitmap;
};

export interface Renderer {
  render(request: RenderRequest): Promise<RenderResult>;
  destroy(): void;
}
