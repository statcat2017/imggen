import type { SourceImage } from "@/types";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
const SUPPORTED_TYPES = ["image/png", "image/jpeg"] as const;

export class ImageDecodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageDecodeError";
  }
}

export function validateFile(file: File): void {
  if (!SUPPORTED_TYPES.includes(file.type as (typeof SUPPORTED_TYPES)[number])) {
    throw new ImageDecodeError(
      "That file type is not supported. Please upload a PNG or JPG image.",
    );
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new ImageDecodeError(
      "This image is too large to process. Please upload an image under 25 MB.",
    );
  }
}

export async function decodeImage(file: File): Promise<SourceImage> {
  validateFile(file);

  const bitmap = await createImageBitmap(file);
  const hasAlpha = file.type === "image/png";

  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.drawImage(bitmap, 0, 0);
    const data = ctx.getImageData(0, 0, bitmap.width, bitmap.height).data;
    const alphaPresent = Array.from(
      { length: bitmap.width * bitmap.height },
      (_, i) => i * 4 + 3,
    ).some((i) => data[i] < 255);
    canvas.remove();
    return {
      id: crypto.randomUUID(),
      fileName: file.name,
      mimeType: file.type as "image/png" | "image/jpeg",
      fileSizeBytes: file.size,
      width: bitmap.width,
      height: bitmap.height,
      hasAlpha: alphaPresent,
      bitmap,
    };
  }
  // Fallback if no 2D context
  canvas.remove();
  return {
    id: crypto.randomUUID(),
    fileName: file.name,
    mimeType: file.type as "image/png" | "image/jpeg",
    fileSizeBytes: file.size,
    width: bitmap.width,
    height: bitmap.height,
    hasAlpha,
    bitmap,
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
