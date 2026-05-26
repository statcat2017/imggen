import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useImageStore } from "@/store/imageStore";
import { useDisplayStore } from "@/store/displayStore";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useRenderController } from "@/hooks/useRenderController";

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

function drawBitmap(
  ctx: CanvasRenderingContext2D,
  bitmap: ImageBitmap | HTMLCanvasElement | OffscreenCanvas,
  w: number,
  h: number,
  zoom: number,
  panX: number,
  panY: number,
) {
  ctx.save();
  ctx.translate(w / 2 + panX, h / 2 + panY);
  ctx.scale(zoom, zoom);
  ctx.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);
  ctx.restore();
}

function drawCheckerboard(ctx: CanvasRenderingContext2D) {
  const size = 8;
  const patternCanvas = document.createElement("canvas");
  patternCanvas.width = size * 2;
  patternCanvas.height = size * 2;
  const patternCtx = patternCanvas.getContext("2d");
  if (!patternCtx) return;
  patternCtx.fillStyle = "#1e1e2e";
  patternCtx.fillRect(0, 0, size * 2, size * 2);
  patternCtx.fillStyle = "#313244";
  patternCtx.fillRect(0, 0, size, size);
  patternCtx.fillRect(size, size, size, size);
  const pattern = ctx.createPattern(patternCanvas, "repeat");
  if (pattern) {
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }
}

function drawSplitView(
  ctx: CanvasRenderingContext2D,
  source: ImageBitmap,
  processed: ImageBitmap | HTMLCanvasElement | OffscreenCanvas,
  w: number,
  h: number,
  zoom: number,
  panX: number,
  panY: number,
  splitRatio: number,
) {
  drawCheckerboard(ctx);

  const splitX = Math.round(w * splitRatio);

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, splitX, h);
  ctx.clip();
  drawBitmap(ctx, source, w, h, zoom, panX, panY);
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.rect(splitX, 0, w - splitX, h);
  ctx.clip();
  drawBitmap(ctx, processed, w, h, zoom, panX, panY);
  ctx.restore();

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(splitX, 0);
  ctx.lineTo(splitX, h);
  ctx.stroke();

  const handleSize = 24;
  const handleY = h / 2;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(splitX - handleSize / 2, handleY - handleSize / 2, handleSize, handleSize, 4);
  ctx.fill();
  ctx.fillStyle = "#1e1e2e";
  ctx.font = "14px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("\u2194", splitX, handleY);
}

export function PreviewStage() {
  const source = useImageStore((s) => s.source);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
  const isDraggingDivider = useRef(false);

  const mode = useDisplayStore((s) => s.tempMode ?? s.mode);
  const splitPosition = useDisplayStore((s) => s.splitPosition);
  const setSplitPosition = useDisplayStore((s) => s.setSplitPosition);

  const getViewTransform = useCallback(
    () => ({ zoom: zoomRef.current, panX: panXRef.current, panY: panYRef.current }),
    [],
  );
  const { scheduleRender, renderStatus, getCachedBitmap } = useRenderController(canvasRef, getViewTransform);
  const registerViewActions = useDisplayStore((s) => s.registerViewActions);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  const viewActions = useMemo(() => ({
    zoomIn: () => {
      zoomRef.current = clamp(zoomRef.current * 1.25, MIN_ZOOM, MAX_ZOOM);
      setDisplayZoom(Math.round(zoomRef.current * 100));
      if (modeRef.current === "original") drawOriginal();
      else scheduleRender();
    },
    zoomOut: () => {
      zoomRef.current = clamp(zoomRef.current / 1.25, MIN_ZOOM, MAX_ZOOM);
      setDisplayZoom(Math.round(zoomRef.current * 100));
      if (modeRef.current === "original") drawOriginal();
      else scheduleRender();
    },
    resetZoom: () => {
      zoomRef.current = fitZoomRef.current;
      panXRef.current = 0;
      panYRef.current = 0;
      setDisplayZoom(Math.round(fitZoomRef.current * 100));
      if (modeRef.current === "original") drawOriginal();
      else scheduleRender();
      bumpViewVersion();
    },
  }), [scheduleRender]);

  useEffect(() => {
    registerViewActions(viewActions);
  }, [registerViewActions, viewActions]);

  useKeyboardShortcuts();

  const updateDisplayZoom = useCallback(() => {
    setDisplayZoom(Math.round(zoomRef.current * 100));
  }, []);

  const drawOriginal = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const currentSource = useImageStore.getState().source;
    if (!canvas || !ctx || !currentSource) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawCheckerboard(ctx);
    drawBitmap(ctx, currentSource.bitmap, w, h, zoomRef.current, panXRef.current, panYRef.current);
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
  }, [source, updateDisplayZoom]);

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
      if (mode === "original") {
        drawOriginal();
      } else if (mode === "split") {
        scheduleRender();
      } else {
        scheduleRender();
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [source, scheduleRender, mode, drawOriginal]);

  useEffect(() => {
    if (mode === "original" && source) {
      drawOriginal();
    } else if (source) {
      scheduleRender();
    }
  }, [mode, source, scheduleRender, drawOriginal]);

  useEffect(() => {
    if (mode !== "split") return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !source) return;

    const processed = getCachedBitmap();
    if (!processed) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    drawSplitView(ctx, source.bitmap, processed, w, h, zoomRef.current, panXRef.current, panYRef.current, splitPosition);
  }, [mode, splitPosition, source, getCachedBitmap, renderStatus]);

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
      updateDisplayZoom();
      if (mode === "original") {
        drawOriginal();
      } else {
        scheduleRender();
      }
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [scheduleRender, updateDisplayZoom, mode, drawOriginal]);

  useEffect(() => {
    function handleGlobalMouseUp() {
      if (isDragging.current) {
        isDragging.current = false;
      }
      if (isDraggingDivider.current) {
        isDraggingDivider.current = false;
      }
    }
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, []);

  function handleMouseDown(e: React.MouseEvent) {
    if (mode === "split") {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mx = e.clientX - rect.left;
      const splitX = rect.width * splitPosition;
      if (Math.abs(mx - splitX) < 20) {
        isDraggingDivider.current = true;
        return;
      }
    }
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    panStart.current = { x: panXRef.current, y: panYRef.current };
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (isDraggingDivider.current && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      setSplitPosition(clamp(mx / rect.width, 0.05, 0.95));
      return;
    }
    if (!isDragging.current) return;
    panXRef.current = panStart.current.x + (e.clientX - dragStart.current.x);
    panYRef.current = panStart.current.y + (e.clientY - dragStart.current.y);
    if (mode === "original") {
      drawOriginal();
    } else {
      scheduleRender();
    }
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
      updateDisplayZoom();
      if (mode === "original") {
        drawOriginal();
      } else {
        scheduleRender();
      }
    } else if (e.touches.length === 1) {
      panXRef.current = panStart.current.x + (e.touches[0].clientX - dragStart.current.x);
      panYRef.current = panStart.current.y + (e.touches[0].clientY - dragStart.current.y);
      if (mode === "original") {
        drawOriginal();
      } else {
        scheduleRender();
      }
    }
  }

  function handleMouseUp() {
    isDragging.current = false;
    isDraggingDivider.current = false;
    bumpViewVersion();
  }

  function handleTouchEnd() {
    isDragging.current = false;
    bumpViewVersion();
    updateDisplayZoom();
  }

  function zoomIn() {
    zoomRef.current = clamp(zoomRef.current * 1.25, MIN_ZOOM, MAX_ZOOM);
    updateDisplayZoom();
    if (mode === "original") {
      drawOriginal();
    } else {
      scheduleRender();
    }
  }

  function zoomOut() {
    zoomRef.current = clamp(zoomRef.current / 1.25, MIN_ZOOM, MAX_ZOOM);
    updateDisplayZoom();
    if (mode === "original") {
      drawOriginal();
    } else {
      scheduleRender();
    }
  }

  function resetZoom() {
    zoomRef.current = fitZoomRef.current;
    panXRef.current = 0;
    panYRef.current = 0;
    updateDisplayZoom();
    if (mode === "original") {
      drawOriginal();
    } else {
      scheduleRender();
    }
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
