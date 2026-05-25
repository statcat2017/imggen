import { useEffect, useId, useRef, useState } from "react";

type ColorPickerProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  const id = useId();
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [hexDraft, setHexDraft] = useState(value);

  useEffect(() => {
    setHexDraft(value);
  }, [value]);

  function handleHexInput(raw: string) {
    setHexDraft(raw);
    if (/^#[0-9a-fA-F]{6}$/.test(raw)) {
      onChange(raw);
    }
  }

  function handleBlur() {
    if (!/^#[0-9a-fA-F]{6}$/.test(hexDraft)) {
      setHexDraft(value);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-ctp-subtext1 text-xs font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => colorInputRef.current?.click()}
          className="h-7 w-7 rounded-full border border-ctp-surface1 shrink-0"
          style={{ background: value }}
          aria-label={`Pick ${label} color`}
        />
        <input
          ref={colorInputRef}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="sr-only"
          id={`${id}-color`}
        />
        <input
          type="text"
          value={hexDraft}
          onChange={(e) => handleHexInput(e.target.value)}
          onBlur={handleBlur}
          className="bg-ctp-surface0 text-ctp-text border border-ctp-surface1 rounded-lg px-2 py-1.5 w-20 font-mono text-xs
            focus-visible:ring-2 focus-visible:ring-ctp-mauve/50 focus-visible:ring-offset-1 focus-visible:ring-offset-ctp-crust focus-visible:outline-none"
          id={`${id}-hex`}
        />
      </div>
    </div>
  );
}
