import { formatFileSize } from "@/services/imageDecoder";
import { useImageStore } from "@/store/imageStore";

export function Metadata() {
  const source = useImageStore((s) => s.source);
  if (!source) return null;

  return (
    <div className="flex items-center gap-4 px-4 py-1.5 text-xs text-ctp-subtext0 border-b border-ctp-surface0 bg-ctp-mantle/50 shrink-0">
      <span className="truncate max-w-[200px]" title={source.fileName}>
        {source.fileName}
      </span>
      <span className="whitespace-nowrap">
        {source.width} &times; {source.height}
      </span>
      <span className="whitespace-nowrap">{formatFileSize(source.fileSizeBytes)}</span>
    </div>
  );
}
