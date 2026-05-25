import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";

type UploadZoneProps = {
  onFileDrop: (file: File) => void;
  disabled?: boolean;
  children: ReactNode;
};

export function UploadZone({ onFileDrop, disabled = false, children }: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const dragDepthRef = useRef(0);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) {
        dragDepthRef.current++;
        setIsDragOver(true);
      }
    },
    [disabled],
  );

  const handleDragLeave = useCallback(() => {
    dragDepthRef.current--;
    if (dragDepthRef.current <= 0) {
      dragDepthRef.current = 0;
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      dragDepthRef.current = 0;
      setIsDragOver(false);
      if (disabled) return;
      const file = e.dataTransfer?.files?.[0];
      if (file) onFileDrop(file);
    },
    [onFileDrop, disabled],
  );

  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      if (disabled) return;
      const items = e.clipboardData?.items;
      const files = e.clipboardData?.files;
      let file: File | null = null;
      if (files?.length) {
        file = files[0];
      } else if (items) {
        for (const item of items) {
          if (item.kind === "file") {
            file = item.getAsFile();
            if (file) break;
          }
        }
      }
      if (file) onFileDrop(file);
    }
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [onFileDrop, disabled]);

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: drag-and-drop surface, keyboard not applicable
    <div
      className="h-full relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {children}
      {isDragOver && (
        <div className="absolute inset-0 z-20 border-2 border-dashed border-ctp-mauve/60 rounded-lg pointer-events-none bg-ctp-base/40" />
      )}
    </div>
  );
}
