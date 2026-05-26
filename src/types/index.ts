export type FilterSettings = {
  presetId: string | null;
  basePresetId: string | null;
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

export type ExportFormat = "png" | "jpeg";

export type ExportResolution = "original" | "preview" | "custom";

export type ExportSettings = {
  format: ExportFormat;
  jpegQuality: number;
  resolution: ExportResolution;
  customWidth: number;
  customHeight: number;
  aspectLock: boolean;
  sharpen: boolean;
};

export type ExportStatus = "idle" | "exporting" | "error";

export type AppView = "empty" | "loaded" | "error";

export type DisplayMode = "processed" | "original" | "split";
