import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ColorPicker } from "@/components/ui/ColorPicker";
import { Select } from "@/components/ui/Select";
import type { SelectOption } from "@/components/ui/Select";
import { Slider } from "@/components/ui/Slider";
import { Toggle } from "@/components/ui/Toggle";
import { builtInPresets } from "@/presets/builtInPresets";
import { useFilterStore, defaultFilterSettings } from "@/store/filterStore";
import { useExportStore } from "@/store/exportStore";
import { useImageStore } from "@/store/imageStore";
import { resolveExportDimensions, recalcAspectRatio } from "@/rendering";
import type { FilterSettings, ExportSettings, ExportFormat, ExportResolution } from "@/types";

type SectionName = "look" | "lines" | "cleanup" | "export";

function getPresetLabel(settings: {
  presetId: string | null;
  basePresetId: string | null;
}): string {
  if (settings.presetId !== null) {
    const preset = builtInPresets.find((p) => p.id === settings.presetId);
    if (preset) return preset.name;
  }
  if (settings.basePresetId !== null) {
    const base = builtInPresets.find((p) => p.id === settings.basePresetId);
    if (base) return `Custom (from ${base.name})`;
  }
  return "Custom";
}

function getPresetDefault<K extends keyof FilterSettings>(
  key: K,
  presetId: string | null,
  basePresetId: string | null,
): FilterSettings[K] {
  const id = presetId ?? basePresetId;
  if (id) {
    const preset = builtInPresets.find((p) => p.id === id);
    if (preset) {
      return preset.settings[key];
    }
  }
  return defaultFilterSettings[key];
}

const formatOptions: SelectOption[] = [
  { value: "png", label: "PNG" },
  { value: "jpeg", label: "JPEG" },
];

const resolutionOptions: SelectOption[] = [
  { value: "original", label: "Original" },
  { value: "preview", label: "Preview" },
  { value: "custom", label: "Custom" },
];

function SectionHeader({
  name,
  label,
  collapsed,
  onToggle,
}: {
  name: string;
  label: string;
  collapsed: boolean;
  onToggle: (name: SectionName) => void;
}) {
  return (
    <button
      type="button"
      className="flex items-center justify-between w-full px-4 py-2 cursor-pointer select-none hover:bg-ctp-surface0/30"
      onClick={() => onToggle(name as SectionName)}
    >
      <span className="text-[11px] uppercase tracking-wider font-medium text-ctp-subtext0">
        {label}
      </span>
      <span className="text-ctp-overlay0 text-xs">{collapsed ? "\u2023" : "\u25BC"}</span>
    </button>
  );
}

export function FilterControlsPanel() {
  const [panelCollapsed, setPanelCollapsed] = useState(true);
  const [sectionCollapsed, setSectionCollapsed] = useState<Set<SectionName>>(new Set());
  const setOnFocusExport = useExportStore((s) => s.setOnFocusExport);

  const focusExport = useCallback(() => {
    setPanelCollapsed(false);
    setSectionCollapsed((prev) => {
      const next = new Set(prev);
      next.delete("export");
      return next;
    });
  }, []);

  useEffect(() => {
    setOnFocusExport(focusExport);
    return () => setOnFocusExport(null);
  }, [focusExport, setOnFocusExport]);

  const [format, setFormat] = useState<ExportFormat>("png");
  const [resolution, setResolution] = useState<ExportResolution>("original");
  const [jpegQuality, setJpegQuality] = useState(0.92);
  const [customWidth, setCustomWidth] = useState(1920);
  const [customHeight, setCustomHeight] = useState(1080);
  const [aspectLock, setAspectLock] = useState(true);
  const [sharpen, setSharpen] = useState(false);

  const settings = useFilterStore((s) => s.settings);
  const update = useFilterStore((s) => s.update);
  const applyPreset = useFilterStore((s) => s.applyPreset);
  const reset = useFilterStore((s) => s.reset);
  const source = useImageStore((s) => s.source);
  const exportImage = useExportStore((s) => s.exportImage);
  const exportStatus = useExportStore((s) => s.status);
  const exportError = useExportStore((s) => s.error);
  const setError = useExportStore((s) => s.setError);

  const dims = useMemo(() => {
    if (!source) return null;
    return resolveExportDimensions(
      source.width,
      source.height,
      resolution,
      customWidth,
      customHeight,
      aspectLock,
    );
  }, [source, resolution, customWidth, customHeight, aspectLock]);

  const handleWidthChange = useCallback(
    (v: number) => {
      setCustomWidth(v);
      if (aspectLock && source) {
        setCustomHeight(recalcAspectRatio("width", v, customHeight, source.width, source.height));
      }
    },
    [aspectLock, source, customHeight],
  );

  const handleHeightChange = useCallback(
    (v: number) => {
      setCustomHeight(v);
      if (aspectLock && source) {
        setCustomWidth(recalcAspectRatio("height", v, customWidth, source.width, source.height));
      }
    },
    [aspectLock, source, customWidth],
  );

  const presetOptions: SelectOption[] = [
    ...builtInPresets.map((p) => ({ value: p.id, label: p.name })),
  ];

  function togglePanel() {
    setPanelCollapsed((prev) => !prev);
  }

  function toggleSection(name: SectionName) {
    setSectionCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }

  const handlePresetChange = useCallback(
    (value: string) => {
      if (value === "") return;
      applyPreset(value);
    },
    [applyPreset],
  );

  const handleExport = useCallback(async () => {
    if (!exportImage) return;
    setError(null);
    const exportSettings: ExportSettings = {
      format,
      jpegQuality,
      resolution,
      customWidth,
      customHeight,
      aspectLock,
      sharpen,
    };
    await exportImage(exportSettings);
  }, [exportImage, format, jpegQuality, resolution, customWidth, customHeight, aspectLock, sharpen, setError]);

  const isExporting = exportStatus === "exporting";

  return (
    <div
      className="absolute bottom-0 left-0 right-0 max-w-[900px] mx-auto w-full
        bg-ctp-mantle/90 backdrop-blur-lg border-t border-ctp-surface0
        rounded-t-xl z-10
        max-md:fixed max-md:bottom-0 max-md:left-0 max-md:right-0 max-md:rounded-none max-md:border-x-0"
    >
      <button
        type="button"
        className="h-11 flex items-center justify-between w-full px-4 cursor-pointer select-none"
        onClick={togglePanel}
      >
        <div className="flex items-center gap-2">
          <span className="text-ctp-overlay0 text-sm font-mono select-none leading-none mt-[-1px]">
            &#9776;
          </span>
          <span className="text-ctp-subtext1 text-sm font-medium">Cell-Shading Controls</span>
        </div>
        <span className="text-ctp-overlay0 text-xs">{panelCollapsed ? "\u25BC" : "\u25B2"}</span>
      </button>

      {!panelCollapsed && (
        <div className="max-h-[260px] overflow-y-auto max-md:max-h-[40vh]">
          {/* Look */}
          <SectionHeader
            name="look"
            label="Look"
            collapsed={sectionCollapsed.has("look")}
            onToggle={toggleSection}
          />
          {!sectionCollapsed.has("look") && (
            <div className="flex flex-col gap-2 px-4 pb-3">
              <Select
                label="Preset"
                value={settings.presetId ?? ""}
                options={presetOptions}
                onChange={handlePresetChange}
              />
              <div className="text-ctp-subtext0 text-xs">
                {getPresetLabel(settings)}
              </div>
              <Slider
                label="Colour Levels"
                value={settings.colourLevels}
                min={2}
                max={16}
                step={1}
                onChange={(v) => update({ colourLevels: v })}
                onReset={() => update({ colourLevels: getPresetDefault("colourLevels", settings.presetId, settings.basePresetId) })}
              />
              <Slider
                label="Contrast"
                value={settings.contrast}
                min={0.5}
                max={2}
                step={0.01}
                onChange={(v) => update({ contrast: v })}
                onReset={() => update({ contrast: getPresetDefault("contrast", settings.presetId, settings.basePresetId) })}
              />
              <Slider
                label="Saturation"
                value={settings.saturation}
                min={0}
                max={2}
                step={0.01}
                onChange={(v) => update({ saturation: v })}
                onReset={() => update({ saturation: getPresetDefault("saturation", settings.presetId, settings.basePresetId) })}
              />
              <Slider
                label="Shadow Bias"
                value={settings.shadowBias}
                min={-1}
                max={1}
                step={0.01}
                onChange={(v) => update({ shadowBias: v })}
                onReset={() => update({ shadowBias: getPresetDefault("shadowBias", settings.presetId, settings.basePresetId) })}
              />
            </div>
          )}

          {/* Lines */}
          <SectionHeader
            name="lines"
            label="Lines"
            collapsed={sectionCollapsed.has("lines")}
            onToggle={toggleSection}
          />
          {!sectionCollapsed.has("lines") && (
            <div className="flex flex-col gap-2 px-4 pb-3">
              <Slider
                label="Edge Strength"
                value={settings.edgeStrength}
                min={0}
                max={1}
                step={0.01}
                onChange={(v) => update({ edgeStrength: v })}
                onReset={() => update({ edgeStrength: getPresetDefault("edgeStrength", settings.presetId, settings.basePresetId) })}
              />
              <Slider
                label="Edge Thickness"
                value={settings.edgeThickness}
                min={0}
                max={8}
                step={0.5}
                suffix="px"
                onChange={(v) => update({ edgeThickness: v })}
                onReset={() => update({ edgeThickness: getPresetDefault("edgeThickness", settings.presetId, settings.basePresetId) })}
              />
              <Slider
                label="Edge Threshold"
                value={settings.edgeThreshold}
                min={0}
                max={1}
                step={0.01}
                onChange={(v) => update({ edgeThreshold: v })}
                onReset={() => update({ edgeThreshold: getPresetDefault("edgeThreshold", settings.presetId, settings.basePresetId) })}
              />
              <ColorPicker
                label="Line Colour"
                value={settings.lineColour}
                onChange={(v) => update({ lineColour: v })}
              />
            </div>
          )}

          {/* Cleanup */}
          <SectionHeader
            name="cleanup"
            label="Cleanup"
            collapsed={sectionCollapsed.has("cleanup")}
            onToggle={toggleSection}
          />
          {!sectionCollapsed.has("cleanup") && (
            <div className="flex flex-col gap-2 px-4 pb-3">
              <Slider
                label="Smoothing"
                value={settings.smoothing}
                min={0}
                max={1}
                step={0.01}
                onChange={(v) => update({ smoothing: v })}
                onReset={() => update({ smoothing: getPresetDefault("smoothing", settings.presetId, settings.basePresetId) })}
              />
              <Toggle
                label="Background Preservation"
                checked={settings.preserveBackground}
                onChange={(v) => update({ preserveBackground: v })}
              />
              <Toggle
                label="Transparent Output"
                checked={settings.preserveTransparency}
                onChange={(v) => update({ preserveTransparency: v })}
              />
            </div>
          )}

          {/* Export */}
          <SectionHeader
            name="export"
            label="Export"
            collapsed={sectionCollapsed.has("export")}
            onToggle={toggleSection}
          />
          {!sectionCollapsed.has("export") && (
            <div className="flex flex-col gap-2 px-4 pb-3">
              <Select label="Format" value={format} options={formatOptions} onChange={(v) => setFormat(v as ExportFormat)} />
              {format === "jpeg" && (
                <Slider
                  label="JPEG Quality"
                  value={jpegQuality}
                  min={0.1}
                  max={1}
                  step={0.01}
                  onChange={setJpegQuality}
                />
              )}
              <Select label="Resolution" value={resolution} options={resolutionOptions} onChange={(v) => setResolution(v as ExportResolution)} />
              {resolution === "custom" && (
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Slider label="Width" value={customWidth} min={1} max={4096} step={1} onChange={handleWidthChange} />
                  </div>
                  <div className="flex-1">
                    <Slider label="Height" value={customHeight} min={1} max={4096} step={1} onChange={handleHeightChange} />
                  </div>
                </div>
              )}
              <Toggle label="Aspect Ratio Lock" checked={aspectLock} onChange={setAspectLock} />
              <Toggle label="Sharpen After Resize" checked={sharpen} onChange={setSharpen} />
              {dims?.capped && (
                <div className="text-ctp-yellow text-xs">
                  Export capped at 4096px on the longest side
                </div>
              )}
              {exportError && (
                <div className="text-ctp-red text-xs">{exportError}</div>
              )}
              <div className="flex gap-2">
                <Button variant="secondary" size="md" onClick={reset}>
                  Reset
                </Button>
                <Button variant="primary" size="md" onClick={handleExport} disabled={isExporting || !exportImage}>
                  {isExporting ? "Exporting\u2026" : "Export Image"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
