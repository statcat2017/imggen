import { useId } from "react";

type SliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
  onReset?: () => void;
};

export function Slider({
  label,
  value,
  min,
  max,
  step = 0.01,
  suffix,
  onChange,
  onReset,
}: SliderProps) {
  const id = useId();

  const formatted = `${value % 1 === 0 ? value.toFixed(0) : value.toFixed(2)}${suffix ? ` ${suffix}` : ""}`;

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: container for double-click reset gesture
    <div className="flex flex-col gap-1.5" onDoubleClick={onReset}>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-ctp-subtext1 text-xs font-medium">
          {label}
        </label>
        <span className="text-ctp-text text-xs font-mono">{formatted}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number.parseFloat(e.target.value))}
      />
    </div>
  );
}
