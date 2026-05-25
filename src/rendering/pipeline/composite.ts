function parseHexColour(hex: string): [number, number, number] {
  const val = hex.replace("#", "");
  return [
    Number.parseInt(val.substring(0, 2), 16),
    Number.parseInt(val.substring(2, 4), 16),
    Number.parseInt(val.substring(4, 6), 16),
  ];
}

function dilateEdgeMask(
  edgeData: Uint8ClampedArray,
  w: number,
  h: number,
  passes: number,
): Uint8ClampedArray {
  let current = new Uint8ClampedArray(edgeData);

  for (let p = 0; p < passes; p++) {
    const out = new Uint8ClampedArray(current.length);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let maxVal = 0;

        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const px = x + kx;
            const py = y + ky;
            if (px >= 0 && px < w && py >= 0 && py < h) {
              const val = current[(py * w + px) * 4];
              if (val > maxVal) maxVal = val;
            }
          }
        }

        const off = (y * w + x) * 4;
        out[off] = maxVal;
        out[off + 1] = maxVal;
        out[off + 2] = maxVal;
        out[off + 3] = 255;
      }
    }

    current = out;
  }

  return current;
}

export function composite(
  base: ImageData,
  edgeMask: ImageData,
  lineColour: string,
  edgeThickness: number,
): ImageData {
  const w = base.width;
  const h = base.height;
  const baseData = base.data;
  const [lineR, lineG, lineB] = parseHexColour(lineColour);

  const dilatePasses = Math.min(4, Math.max(0, Math.round(edgeThickness / 2)));
  const dilated = dilateEdgeMask(edgeMask.data, w, h, dilatePasses);

  const out = new Uint8ClampedArray(baseData.length);

  for (let i = 0; i < baseData.length; i += 4) {
    const edgeAlpha = dilated[i] / 255;

    out[i] = Math.round(baseData[i] * (1 - edgeAlpha) + lineR * edgeAlpha);
    out[i + 1] = Math.round(baseData[i + 1] * (1 - edgeAlpha) + lineG * edgeAlpha);
    out[i + 2] = Math.round(baseData[i + 2] * (1 - edgeAlpha) + lineB * edgeAlpha);
    out[i + 3] = baseData[i + 3];
  }

  return new ImageData(out, w, h);
}
