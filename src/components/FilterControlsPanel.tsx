import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ColorPicker } from "@/components/ui/ColorPicker";
import { Select } from "@/components/ui/Select";
import { Slider } from "@/components/ui/Slider";
import { Toggle } from "@/components/ui/Toggle";
import { builtInPresets } from "@/presets/builtInPresets";
import { useFilterStore } from "@/store/filterStore";

type SectionName = "look" | "lines" | "cleanup" | "export";

const presetOptions = builtInPresets.map((p) => ({ value: p.id, label: p.name }));

const formatOptions = [
  { value: "png", label: "PNG" },
  { value: "jpeg", label: "JPEG" },
];

const resolutionOptions = [
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
  const [format, setFormat] = useState("png");
  const [resolution, setResolution] = useState("original");

  const settings = useFilterStore((s) => s.settings);
  const update = useFilterStore((s) => s.update);
  const applyPreset = useFilterStore((s) => s.applyPreset);

  const selectedPreset = builtInPresets.find((p) => p.id === settings.presetId) ?? builtInPresets[0];

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
                value={settings.presetId}
                options={presetOptions}
                onChange={applyPreset}
              />
              <Slider
                label="Colour Levels"
                value={settings.colourLevels}
                min={2}
                max={16}
                step={1}
                onChange={(v) => update({ colourLevels: v })}
                onReset={() => update({ colourLevels: selectedPreset.settings.colourLevels })}
              />
              <Slider
                label="Contrast"
                value={settings.contrast}
                min={0.5}
                max={2}
                step={0.01}
                onChange={(v) => update({ contrast: v })}
                onReset={() => update({ contrast: selectedPreset.settings.contrast })}
              />
              <Slider
                label="Saturation"
                value={settings.saturation}
                min={0}
                max={2}
                step={0.01}
                onChange={(v) => update({ saturation: v })}
                onReset={() => update({ saturation: selectedPreset.settings.saturation })}
              />
              <Slider
                label="Shadow Bias"
                value={settings.shadowBias}
                min={-1}
                max={1}
                step={0.01}
                onChange={(v) => update({ shadowBias: v })}
                onReset={() => update({ shadowBias: selectedPreset.settings.shadowBias })}
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
                onReset={() => update({ edgeStrength: selectedPreset.settings.edgeStrength })}
              />
              <Slider
                label="Edge Thickness"
                value={settings.edgeThickness}
                min={0}
                max={8}
                step={0.5}
                suffix="px"
                onChange={(v) => update({ edgeThickness: v })}
                onReset={() => update({ edgeThickness: selectedPreset.settings.edgeThickness })}
              />
              <Slider
                label="Edge Threshold"
                value={settings.edgeThreshold}
                min={0}
                max={1}
                step={0.01}
                onChange={(v) => update({ edgeThreshold: v })}
                onReset={() => update({ edgeThreshold: selectedPreset.settings.edgeThreshold })}
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
                onReset={() => update({ smoothing: selectedPreset.settings.smoothing })}
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
              <Select label="Format" value={format} options={formatOptions} onChange={setFormat} />
              <Select
                label="Resolution"
                value={resolution}
                options={resolutionOptions}
                onChange={setResolution}
              />
              <Button variant="primary" size="md" onClick={() => {}}>
                Export Image
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
