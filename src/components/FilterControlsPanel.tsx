import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ColorPicker } from "@/components/ui/ColorPicker";
import { Select } from "@/components/ui/Select";
import { Slider } from "@/components/ui/Slider";
import { Toggle } from "@/components/ui/Toggle";

type SectionName = "look" | "lines" | "cleanup" | "export";

const presetOptions = [
  { value: "adventure-background", label: "Adventure Background" },
  { value: "comic-ink", label: "Comic Ink" },
  { value: "soft-painted", label: "Soft Painted" },
  { value: "pixel-friendly-flat", label: "Pixel-Friendly Flat" },
  { value: "dark-neo-noir", label: "Dark Neo-Noir" },
];

const formatOptions = [
  { value: "png", label: "PNG" },
  { value: "jpeg", label: "JPEG" },
];

const resolutionOptions = [
  { value: "original", label: "Original" },
  { value: "2x", label: "2x" },
  { value: "0.5x", label: "0.5x" },
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

  const [preset, setPreset] = useState("adventure-background");
  const [colourLevels, setColourLevels] = useState(6);
  const [contrast, setContrast] = useState(1.1);
  const [saturation, setSaturation] = useState(1.15);
  const [shadowBias, setShadowBias] = useState(0.0);
  const [edgeStrength, setEdgeStrength] = useState(0.65);
  const [edgeThickness, setEdgeThickness] = useState(1.5);
  const [edgeThreshold, setEdgeThreshold] = useState(0.25);
  const [lineColour, setLineColour] = useState("#111111");
  const [smoothing, setSmoothing] = useState(0.35);
  const [preserveBackground, setPreserveBackground] = useState(true);
  const [transparentOutput, setTransparentOutput] = useState(true);
  const [format, setFormat] = useState("png");
  const [_resolution, setResolution] = useState("original");

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
              <Select label="Preset" value={preset} options={presetOptions} onChange={setPreset} />
              <Slider
                label="Colour Levels"
                value={colourLevels}
                min={2}
                max={16}
                step={1}
                onChange={setColourLevels}
              />
              <Slider
                label="Contrast"
                value={contrast}
                min={0.5}
                max={2}
                step={0.01}
                onChange={setContrast}
              />
              <Slider
                label="Saturation"
                value={saturation}
                min={0}
                max={2}
                step={0.01}
                onChange={setSaturation}
              />
              <Slider
                label="Shadow Bias"
                value={shadowBias}
                min={-1}
                max={1}
                step={0.01}
                onChange={setShadowBias}
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
                value={edgeStrength}
                min={0}
                max={1}
                step={0.01}
                onChange={setEdgeStrength}
              />
              <Slider
                label="Edge Thickness"
                value={edgeThickness}
                min={0}
                max={8}
                step={0.5}
                suffix="px"
                onChange={setEdgeThickness}
              />
              <Slider
                label="Edge Threshold"
                value={edgeThreshold}
                min={0}
                max={1}
                step={0.01}
                onChange={setEdgeThreshold}
              />
              <ColorPicker label="Line Colour" value={lineColour} onChange={setLineColour} />
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
                value={smoothing}
                min={0}
                max={1}
                step={0.01}
                onChange={setSmoothing}
              />
              <Toggle
                label="Background Preservation"
                checked={preserveBackground}
                onChange={setPreserveBackground}
              />
              <Toggle
                label="Transparent Output"
                checked={transparentOutput}
                onChange={setTransparentOutput}
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
                value={_resolution}
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
