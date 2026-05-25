export type FilterSettings = {
  presetId: string | null;
  colourLevels: number;
  edgeStrength: number;
  edgeThickness: number;
  edgeThreshold: number;
  smoothing: number;
  contrast: number;
  saturation: number;
  shadowBias: number;
  lineColour: string;
  preserveBackground: boolean;
  preserveTransparency: boolean;
};

export type SourceImage = {
  id: string;
  fileName: string;
  mimeType: "image/png" | "image/jpeg";
  fileSizeBytes: number;
  width: number;
  height: number;
  hasAlpha: boolean;
  bitmap: ImageBitmap;
};

export type FilterPreset = {
  id: string;
  name: string;
  builtIn: boolean;
  description?: string;
  settings: FilterSettings;
};

export type ExportSettings = {
  format: "png" | "jpeg";
  jpegQuality: number;
  width: number;
  height: number;
  preserveAspectRatio: boolean;
  useOriginalResolution: boolean;
  sharpenAfterResize: boolean;
};

export type AppView = "empty" | "loaded" | "error";

export type DisplayMode = "processed" | "original" | "split";

export type ExportFormat = "png" | "jpeg";

export type ExportResolution = "original" | "preview" | "custom";
