import { useCallback, useEffect, useRef, useState } from "react";
import { RenderController, createPreviewRenderer } from "@/rendering";
import { useFilterStore } from "@/store/filterStore";
import { useImageStore } from "@/store/imageStore";
import { renderExport } from "@/services/exportService";
import { generateExportFilename } from "@/services/filename";
import { useExportStore } from "@/store/exportStore";
import type { ExportSettings } from "@/types";

export type RenderStatus = "idle" | "rendering" | "exporting";

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function useRenderController(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  getViewTransform: () => { zoom: number; panX: number; panY: number },
) {
  const source = useImageStore((s) => s.source);
  const settings = useFilterStore((s) => s.settings);
  const controllerRef = useRef<RenderController | null>(null);
  if (!controllerRef.current) {
    controllerRef.current = new RenderController(createPreviewRenderer());
  }
  const rafIdRef = useRef<number | null>(null);
  const renderTokenRef = useRef(0);
  const isExportingRef = useRef(false);
  const [renderStatus, setRenderStatus] = useState<RenderStatus>("idle");

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      controllerRef.current!.destroy();
    };
  }, []);

  useEffect(() => {
    useExportStore.getState().setStatus(renderStatus === "exporting" ? "exporting" : "idle");
  }, [renderStatus]);

  const scheduleRender = useCallback(() => {
    if (isExportingRef.current) return;
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
    }
    const token = ++renderTokenRef.current;
    rafIdRef.current = requestAnimationFrame(async () => {
      rafIdRef.current = null;
      const canvas = canvasRef.current;
      const currentSource = useImageStore.getState().source;
      const currentSettings = useFilterStore.getState().settings;
      if (!canvas || !currentSource || !currentSettings) return;
      const { zoom, panX, panY } = getViewTransform();
      setRenderStatus("rendering");
      await controllerRef.current!.renderPreview(
        currentSource.bitmap,
        canvas,
        zoom,
        panX,
        panY,
        currentSettings,
        currentSource.id,
      );
      if (token === renderTokenRef.current) {
        setRenderStatus("idle");
      }
    });
  }, [canvasRef, getViewTransform]);

  const exportImage = useCallback(
    async (exportSettings: ExportSettings) => {
      const currentSource = useImageStore.getState().source;
      const currentSettings = useFilterStore.getState().settings;
      if (!currentSource || !currentSettings) return;

      ++renderTokenRef.current;
      isExportingRef.current = true;
      setRenderStatus("exporting");
      useExportStore.getState().setError(null);

      try {
        const { blob, capped } = await renderExport(
          controllerRef.current!.getRenderer(),
          currentSource.bitmap,
          currentSettings,
          exportSettings,
        );
        triggerDownload(blob, generateExportFilename(currentSource.fileName, exportSettings.format));
        if (capped) {
          useExportStore.getState().setError("Export capped at 4096px on the longest side");
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Export failed";
        useExportStore.getState().setError(message);
      } finally {
        isExportingRef.current = false;
        setRenderStatus("idle");
        scheduleRender();
      }
    },
    [scheduleRender],
  );

  useEffect(() => {
    useExportStore.getState().setExportImage(source && settings ? exportImage : null);
  }, [source, settings, exportImage]);

  useEffect(() => {
    if (source && settings) {
      scheduleRender();
    }
  }, [source, settings, scheduleRender]);

  return { scheduleRender, renderStatus, exportImage };
}
