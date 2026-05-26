import { describe, it, expect } from "vitest";
import { validateFile } from "@/services/imageDecoder";

describe("validateFile", () => {
  it("accepts PNG files", () => {
    const file = new File([""], "test.png", { type: "image/png" });
    expect(() => validateFile(file)).not.toThrow();
  });

  it("accepts JPEG files", () => {
    const file = new File([""], "test.jpg", { type: "image/jpeg" });
    expect(() => validateFile(file)).not.toThrow();
  });

  it("rejects unsupported types", () => {
    const file = new File([""], "test.gif", { type: "image/gif" });
    expect(() => validateFile(file)).toThrow("That file type is not supported");
  });

  it("rejects oversized files", () => {
    const oversized = new File([new ArrayBuffer(26 * 1024 * 1024)], "large.png", { type: "image/png" });
    expect(() => validateFile(oversized)).toThrow("too large");
  });

  it("passes files under the size limit", () => {
    const small = new File([new ArrayBuffer(1024)], "small.png", { type: "image/png" });
    expect(() => validateFile(small)).not.toThrow();
  });
});
