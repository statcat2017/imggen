function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;

  if (max === min) return [0, 0, l];

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  switch (max) {
    case rn: h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6; break;
    case gn: h = ((bn - rn) / d + 2) / 6; break;
    case bn: h = ((rn - gn) / d + 4) / 6; break;
  }

  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  if (s === 0) {
    const val = Math.round(l * 255);
    return [val, val, val];
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ];
}

function clampByte(val: number): number {
  return Math.min(255, Math.max(0, Math.round(val)));
}

export function colorCorrect(
  imageData: ImageData,
  contrast: number,
  saturation: number,
  shadowBias: number,
): ImageData {
  const data = imageData.data;
  const out = new Uint8ClampedArray(data.length);

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;

    let cr = (rNorm - 0.5) * contrast + 0.5 + shadowBias;
    let cg = (gNorm - 0.5) * contrast + 0.5 + shadowBias;
    let cb = (bNorm - 0.5) * contrast + 0.5 + shadowBias;

    cr = Math.min(1, Math.max(0, cr));
    cg = Math.min(1, Math.max(0, cg));
    cb = Math.min(1, Math.max(0, cb));

    if (Math.abs(saturation - 1) > 0.001) {
      const [h, s, l] = rgbToHsl(
        cr * 255,
        cg * 255,
        cb * 255,
      );
      const newS = Math.min(1, Math.max(0, s * saturation));
      [r, g, b] = hslToRgb(h, newS, l);
    } else {
      r = clampByte(cr * 255);
      g = clampByte(cg * 255);
      b = clampByte(cb * 255);
    }

    out[i] = r;
    out[i + 1] = g;
    out[i + 2] = b;
    out[i + 3] = data[i + 3];
  }

  return new ImageData(out, imageData.width, imageData.height);
}
