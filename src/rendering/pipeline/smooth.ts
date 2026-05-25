function boxBlurPass(
  data: Uint8ClampedArray<ArrayBuffer>,
  w: number,
  h: number,
): Uint8ClampedArray<ArrayBuffer> {
  const out: Uint8ClampedArray<ArrayBuffer> = new Uint8ClampedArray(data.length);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let r = 0, g = 0, b = 0, a = 0, count = 0;

      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const px = x + kx;
          const py = y + ky;
          if (px >= 0 && px < w && py >= 0 && py < h) {
            const i = (py * w + px) * 4;
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            a += data[i + 3];
            count++;
          }
        }
      }

      const i = (y * w + x) * 4;
      out[i] = r / count;
      out[i + 1] = g / count;
      out[i + 2] = b / count;
      out[i + 3] = a / count;
    }
  }

  return out;
}

export function smooth(
  imageData: ImageData,
  amount: number,
): ImageData {
  if (amount < 0.01) return imageData;

  const passes = Math.max(1, Math.round(amount * 3));
  let data: Uint8ClampedArray<ArrayBuffer> = new Uint8ClampedArray(imageData.data.length);
  data.set(imageData.data);

  for (let p = 0; p < passes; p++) {
    data = boxBlurPass(data, imageData.width, imageData.height);
  }

  return new ImageData(data, imageData.width, imageData.height);
}
