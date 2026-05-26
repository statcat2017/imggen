export function createImageData(w: number, h: number, fill: (x: number, y: number) => [number, number, number, number]): ImageData {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [r, g, b, a] = fill(x, y);
      const i = (y * w + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = a;
    }
  }
  return new ImageData(data, w, h);
}

export const FIXTURE_SIZE = 32;

export const fixtureHighContrast = createImageData(FIXTURE_SIZE, FIXTURE_SIZE, (x, y) => {
  if (x < FIXTURE_SIZE / 2 && y < FIXTURE_SIZE / 2) return [255, 255, 255, 255];
  if (x >= FIXTURE_SIZE / 2 && y < FIXTURE_SIZE / 2) return [0, 0, 0, 255];
  if (x < FIXTURE_SIZE / 2 && y >= FIXTURE_SIZE / 2) return [255, 0, 0, 255];
  return [0, 255, 0, 255];
});

export const fixtureLowLight = createImageData(FIXTURE_SIZE, FIXTURE_SIZE, (x, _y) => {
  const val = Math.round(20 + (x / FIXTURE_SIZE) * 15);
  return [val, val, val, 255];
});

export const fixtureLandscape = createImageData(FIXTURE_SIZE, FIXTURE_SIZE, (x, y) => {
  const sky = y < FIXTURE_SIZE / 2;
  if (sky) return [100, 150, 255, 255];
  const green = Math.round(80 + (x / FIXTURE_SIZE) * 60);
  return [30, green, 20, 255];
});

export const fixturePortrait = createImageData(FIXTURE_SIZE, FIXTURE_SIZE, (x, y) => {
  const skin = Math.round(180 + (x / FIXTURE_SIZE) * 40);
  const hair = y < FIXTURE_SIZE / 3;
  if (hair) return [40, 20, 10, 255];
  return [skin, Math.round(skin * 0.75), Math.round(skin * 0.6), 255];
});

export const fixtureTransparentPng = createImageData(FIXTURE_SIZE, FIXTURE_SIZE, (x, y) => {
  const center = x > FIXTURE_SIZE / 4 && x < (3 * FIXTURE_SIZE) / 4 && y > FIXTURE_SIZE / 4 && y < (3 * FIXTURE_SIZE) / 4;
  if (!center) return [0, 0, 0, 0];
  return [200, 100, 50, 200];
});

export const fixtureWide = createImageData(FIXTURE_SIZE, FIXTURE_SIZE / 2, (x, _y) => {
  const v = Math.round((x / FIXTURE_SIZE) * 255);
  return [v, v, v, 255];
});

export const fixtureTall = createImageData(FIXTURE_SIZE / 2, FIXTURE_SIZE, (_, y) => {
  const v = Math.round((y / FIXTURE_SIZE) * 255);
  return [v, 0, 255 - v, 255];
});

export const fixtureNoisy = createImageData(FIXTURE_SIZE, FIXTURE_SIZE, (x, y) => {
  const seed = (x * 7 + y * 31) % 255;
  return [seed, (seed * 3) % 255, (seed * 7) % 255, 255];
});

export interface FixtureCase {
  name: string;
  imageData: ImageData;
}

export const allFixtures: FixtureCase[] = [
  { name: "highContrast", imageData: fixtureHighContrast },
  { name: "lowLight", imageData: fixtureLowLight },
  { name: "landscape", imageData: fixtureLandscape },
  { name: "portrait", imageData: fixturePortrait },
  { name: "transparentPng", imageData: fixtureTransparentPng },
  { name: "wide", imageData: fixtureWide },
  { name: "tall", imageData: fixtureTall },
  { name: "noisy", imageData: fixtureNoisy },
];

export function pixelDelta(a: Uint8ClampedArray, b: Uint8ClampedArray): number {
  if (a.length !== b.length) return Infinity;
  let maxDelta = 0;
  for (let i = 0; i < a.length; i++) {
    const d = Math.abs(a[i] - b[i]);
    if (d > maxDelta) maxDelta = d;
  }
  return maxDelta;
}
