import type { FilterSettings } from "@/types";
import { colorCorrect } from "./colorCorrect";
import { composite } from "./composite";
import { edgeDetect } from "./edgeDetect";
import { posterize } from "./posterize";
import { smooth } from "./smooth";

export { colorCorrect, composite, edgeDetect, posterize, smooth };

export function runPipeline(
  imageData: ImageData,
  settings: FilterSettings,
): ImageData {
  const smoothed = smooth(imageData, settings.smoothing);
  const corrected = colorCorrect(
    smoothed,
    settings.contrast,
    settings.saturation,
    settings.shadowBias,
  );
  const posterized = posterize(corrected, settings.colourLevels);
  const edgeMask = edgeDetect(
    posterized,
    settings.edgeThreshold,
    settings.edgeStrength,
  );
  return composite(posterized, edgeMask, settings.lineColour, settings.edgeThickness);
}
