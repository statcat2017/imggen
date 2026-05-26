import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

const store = new Map<string, string>();

const mockStorage: Storage = {
  getItem: vi.fn((key: string) => store.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => { store.set(key, value); }),
  removeItem: vi.fn((key: string) => { store.delete(key); }),
  clear: vi.fn(() => { store.clear(); }),
  key: vi.fn((index: number) => Array.from(store.keys())[index] ?? null),
  get length() { return store.size; },
};

vi.stubGlobal("localStorage", mockStorage);

if (typeof globalThis.ImageData === "undefined") {
  class FakeImageData {
    data: Uint8ClampedArray;
    width: number;
    height: number;
    constructor(data: Uint8ClampedArray, width: number, height?: number) {
      this.data = data;
      this.width = width;
      this.height = height ?? data.length / 4 / width;
    }
  }
  vi.stubGlobal("ImageData", FakeImageData);
}
