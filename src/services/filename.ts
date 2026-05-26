export function generateExportFilename(originalName: string, format: "png" | "jpeg"): string {
  const base = originalName
    .replace(/^.*[/\\]/, "")
    .replace(/\.[^.]+$/, "")
    .replace(/[<>:"/\\|?*]/g, "_")
    .slice(0, 64) || "image";

  const ext = format === "jpeg" ? "jpg" : "png";
  return `${base}-cellshaded.${ext}`;
}
