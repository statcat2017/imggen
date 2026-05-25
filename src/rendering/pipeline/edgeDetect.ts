function computeLuminance(data: Uint8ClampedArray): Float64Array {
  const len = data.length / 4;
  const lum = new Float64Array(len);

  for (let i = 0; i < len; i++) {
    const off = i * 4;
    lum[i] = 0.2126 * data[off] + 0.7152 * data[off + 1] + 0.0722 * data[off + 2];
  }

  return lum;
}

export function edgeDetect(
  imageData: ImageData,
  threshold: number,
  strength: number,
): ImageData {
  const w = imageData.width;
  const h = imageData.height;
  const data = imageData.data;
  const lum = computeLuminance(data);
  const out = new Uint8ClampedArray(data.length);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;

      let gx = 0, gy = 0;

      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const px = x + kx;
          const py = y + ky;
          if (px < 0 || px >= w || py < 0 || py >= h) continue;

          const sample = lum[py * w + px];
          const sx = kx === 0 ? 0 : (kx < 0 ? -1 : 1);
          const sy = ky === 0 ? 0 : (ky < 0 ? -1 : 1);

          if (sx !== 0 && sy !== 0) {
            gx += sx * sample;
            gy += sy * sample;
          } else if (sx !== 0) {
            gx += sx * sample * 2;
          } else if (sy !== 0) {
            gy += sy * sample * 2;
          }
        }
      }

      const magnitude = Math.sqrt(gx * gx + gy * gy);
      const normalized = Math.min(255, magnitude / 4);
      const edge = normalized > threshold * 255 ? Math.round(normalized * strength) : 0;

      const off = i * 4;
      out[off] = edge;
      out[off + 1] = edge;
      out[off + 2] = edge;
      out[off + 3] = 255;
    }
  }

  return new ImageData(out, w, h);
}


