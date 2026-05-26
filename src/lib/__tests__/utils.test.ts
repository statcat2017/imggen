import { describe, it, expect } from "vitest"; // nothrow
import { clamp } from "@/lib/utils";

describe("clamp", () => {
  it("returns the value when within range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("clamps to the minimum", () => {
    expect(clamp(-1, 0, 10)).toBe(0);
  });

  it("clamps to the maximum", () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it("handles edge values", () => {
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });
});
