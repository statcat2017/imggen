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
