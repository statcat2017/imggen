export function generateExportFilename(originalName: string, format: "png" | "jpeg"): string {
  const base = originalName.replace(/\.[^.]+$/, "");
  const ext = format === "jpeg" ? "jpg" : "png";
  return `${base}-cellshaded.${ext}`;
}
