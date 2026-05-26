import { describe, it, expect } from "vitest";
import { generateExportFilename } from "@/services/filename";

describe("generateExportFilename", () => {
  it("appends -cellshaded to the base name", () => {
    expect(generateExportFilename("photo.png", "png")).toBe("photo-cellshaded.png");
  });

  it("replaces extension with .jpg for JPEG format", () => {
    expect(generateExportFilename("photo.png", "jpeg")).toBe("photo-cellshaded.jpg");
  });

  it("strips path separators", () => {
    expect(generateExportFilename("photos/summer/beach.jpg", "png")).toBe("beach-cellshaded.png");
    expect(generateExportFilename("C:\\Users\\test\\pic.jpg", "png")).toBe("pic-cellshaded.png");
  });

  it("replaces unsafe characters with underscores", () => {
    expect(generateExportFilename("my file:test.jpg", "png")).toBe("my file_test-cellshaded.png");
    expect(generateExportFilename('a<b>c"d.jpg', "png")).toBe("a_b_c_d-cellshaded.png");
  });

  it("limits base to 64 characters", () => {
    const longName = "a".repeat(100) + ".jpg";
    const result = generateExportFilename(longName, "png");
    expect(result.length).toBeLessThanOrEqual(80);
    expect(result).toMatch(/^a{64}-cellshaded\.png$/);
  });

  it("falls back to 'image' when filename is only extension", () => {
    expect(generateExportFilename(".png", "png")).toBe("image-cellshaded.png");
  });
});
