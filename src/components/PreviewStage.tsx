import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { RenderController } from "@/rendering/RenderController";
import { useFilterStore } from "@/store/filterStore";
import { useImageStore } from "@/store/imageStore";

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 5;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getTouchDist(touches: React.TouchList): number {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function calcFitZoom(
  imageW: number,
  imageH: number,
  containerW: number,
  containerH: number,
): number {
  if (imageW === 0 || imageH === 0 || containerW === 0 || containerH === 0) return 1;
  return Math.min(containerW / imageW, containerH / imageH) * 0.9;
}

export function PreviewStage() {
  const source = useImageStore((s) => s.source);
  const settings = useFilterStore((s) => s.settings);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef<RenderController>(new RenderController());
  const zoomRef = useRef(1);
  const panXRef = useRef(0);
  const panYRef = useRef(0);
  const fitZoomRef = useRef(1);
  const [displayZoom, setDisplayZoom] = useState(100);
  const [, bumpViewVersion] = useReducer((v: number) => v + 1, 0);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });
  const lastTouchDist = useRef(0);
  const touchStartZoom = useRef(0);
  const touchCenter = useRef({ x: 0, y: 0 });

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const img = useImageStore.getState().source;
    const currentSettings = useFilterStore.getState().settings;
    if (!canvas || !img) return;
    void controllerRef.current.renderPreview(
      img.bitmap, canvas, zoomRef.current, panXRef.current, panYRef.current, currentSettings, img.id,
    );
  }, []);

  const updateDisplayZoom = useCallback(() => {
    setDisplayZoom(Math.round(zoomRef.current * 100));
  }, []);

  useEffect(() => {
    if (!source || !containerRef.current) return;
    const fit = calcFitZoom(
      source.width,
      source.height,
      containerRef.current.clientWidth,
      containerRef.current.clientHeight,
    );
    fitZoomRef.current = fit;
    zoomRef.current = fit;
    panXRef.current = 0;
    panYRef.current = 0;
    updateDisplayZoom();
    render();
  }, [source, render, updateDisplayZoom]);

  useEffect(() => {
    render();
    // biome-ignore lint/correctness/useExhaustiveDependencies: settings trigger is needed even though render() reads from store internally
  }, [render, settings]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => {
      if (source) {
        const fit = calcFitZoom(
          source.width,
          source.height,
          container.clientWidth,
          container.clientHeight,
        );
        fitZoomRef.current = fit;
      }
      render();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [source, render]);

  useEffect(() => {
    function handleWheel(e: WheelEvent) {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const delta = -e.deltaY;
      const factor = delta > 0 ? 1.1 : 1 / 1.1;
      const newZoom = clamp(zoomRef.current * factor, MIN_ZOOM, MAX_ZOOM);
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const cx = canvas.clientWidth / 2;
      const cy = canvas.clientHeight / 2;
      const ratio = newZoom / zoomRef.current;
      panXRef.current = (mx - cx) * (1 - ratio) + panXRef.current * ratio;
      panYRef.current = (my - cy) * (1 - ratio) + panYRef.current * ratio;
      zoomRef.current = newZoom;
      render();
      updateDisplayZoom();
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [render, updateDisplayZoom]);

  useEffect(() => {
    function handleGlobalMouseUp() {
      if (isDragging.current) {
        isDragging.current = false;
      }
    }
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, []);

  function handleMouseDown(e: React.MouseEvent) {
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    panStart.current = { x: panXRef.current, y: panYRef.current };
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!isDragging.current) return;
    panXRef.current = panStart.current.x + (e.clientX - dragStart.current.x);
    panYRef.current = panStart.current.y + (e.clientY - dragStart.current.y);
    render();
  }

  function handleTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      e.preventDefault();
      lastTouchDist.current = getTouchDist(e.touches);
      touchStartZoom.current = zoomRef.current;
      touchCenter.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
    } else if (e.touches.length === 1) {
      dragStart.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
      panStart.current = { x: panXRef.current, y: panYRef.current };
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dist = getTouchDist(e.touches);
      const ratio = dist / lastTouchDist.current;
      const newZoom = clamp(touchStartZoom.current * ratio, MIN_ZOOM, MAX_ZOOM);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = touchCenter.current.x - rect.left;
      const my = touchCenter.current.y - rect.top;
      const cx = canvas.clientWidth / 2;
      const cy = canvas.clientHeight / 2;
      const zoomRatio = newZoom / zoomRef.current;
      panXRef.current = (mx - cx) * (1 - zoomRatio) + panXRef.current * zoomRatio;
      panYRef.current = (my - cy) * (1 - zoomRatio) + panYRef.current * zoomRatio;
      zoomRef.current = newZoom;
      render();
      updateDisplayZoom();
    } else if (e.touches.length === 1) {
      panXRef.current = panStart.current.x + (e.touches[0].clientX - dragStart.current.x);
      panYRef.current = panStart.current.y + (e.touches[0].clientY - dragStart.current.y);
      render();
    }
  }

  function handleMouseUp() {
    isDragging.current = false;
    bumpViewVersion();
  }

  function handleTouchEnd() {
    isDragging.current = false;
    bumpViewVersion();
    updateDisplayZoom();
  }

  function zoomIn() {
    zoomRef.current = clamp(zoomRef.current * 1.25, MIN_ZOOM, MAX_ZOOM);
    render();
    updateDisplayZoom();
  }

  function zoomOut() {
    zoomRef.current = clamp(zoomRef.current / 1.25, MIN_ZOOM, MAX_ZOOM);
    render();
    updateDisplayZoom();
  }

  function resetZoom() {
    zoomRef.current = fitZoomRef.current;
    panXRef.current = 0;
    panYRef.current = 0;
    render();
    updateDisplayZoom();
    bumpViewVersion();
  }

  const isZoomed = Math.abs(zoomRef.current - fitZoomRef.current) > 0.01;
  const isPanned = Math.abs(panXRef.current) > 0.5 || Math.abs(panYRef.current) > 0.5;
  const showReset = isZoomed || isPanned;

  if (!source) return null;

  return (
    <div ref={containerRef} className="h-full relative overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-ctp-base/80 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-ctp-subtext0 select-none">
        <button
          type="button"
          aria-label="Zoom out"
          onClick={zoomOut}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-ctp-surface0 cursor-pointer"
        >
          {"\u2212"}
        </button>
        <span className="min-w-[4rem] text-center">{displayZoom}%</span>
        <button
          type="button"
          aria-label="Zoom in"
          onClick={zoomIn}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-ctp-surface0 cursor-pointer"
        >
          +
        </button>
        {showReset && (
          <button
            type="button"
            aria-label="Reset zoom"
            onClick={resetZoom}
            className="ml-2 px-2 py-1 rounded hover:bg-ctp-surface0 cursor-pointer text-ctp-mauve"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
