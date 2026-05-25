export function posterize(imageData: ImageData, levels: number): ImageData {
  if (levels < 2) return imageData;

  const data = imageData.data;
  const out = new Uint8ClampedArray(data.length);
  const factor = levels - 1;

  for (let i = 0; i < data.length; i += 4) {
    const rNorm = data[i] / 255;
    const gNorm = data[i + 1] / 255;
    const bNorm = data[i + 2] / 255;

    out[i] = Math.round(Math.round(rNorm * factor) * 255 / factor);
    out[i + 1] = Math.round(Math.round(gNorm * factor) * 255 / factor);
    out[i + 2] = Math.round(Math.round(bNorm * factor) * 255 / factor);
    out[i + 3] = data[i + 3];
  }

  return new ImageData(out, imageData.width, imageData.height);
}
