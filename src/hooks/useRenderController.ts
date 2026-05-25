import { useCallback, useEffect, useRef, useState } from "react";
import { RenderController } from "@/rendering/RenderController";
import { useFilterStore } from "@/store/filterStore";
import { useImageStore } from "@/store/imageStore";

export type RenderStatus = "idle" | "rendering";

export function useRenderController(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  getViewTransform: () => { zoom: number; panX: number; panY: number },
) {
  const source = useImageStore((s) => s.source);
  const settings = useFilterStore((s) => s.settings);
  const controllerRef = useRef<RenderController>(new RenderController());
  const rafIdRef = useRef<number | null>(null);
  const renderTokenRef = useRef(0);
  const [renderStatus, setRenderStatus] = useState<RenderStatus>("idle");

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      controllerRef.current.destroy();
    };
  }, []);

  const scheduleRender = useCallback(() => {
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
      await controllerRef.current.renderPreview(
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

  useEffect(() => {
    if (source && settings) {
      scheduleRender();
    }
  }, [source, settings, scheduleRender]);

  return { scheduleRender, renderStatus };
}
