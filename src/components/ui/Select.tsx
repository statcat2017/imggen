import { useId } from "react";

export type SelectOption = { value: string; label: string; disabled?: boolean };

type SelectProps = {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
};

export function Select({ label, value, options, onChange }: SelectProps) {
  const id = useId();

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-ctp-subtext1 text-xs font-medium">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-ctp-surface0 text-ctp-text border border-ctp-surface1 rounded-lg px-3 py-2 text-sm min-h-11 w-full cursor-pointer
          focus-visible:ring-2 focus-visible:ring-ctp-mauve/50 focus-visible:ring-offset-1 focus-visible:ring-offset-ctp-crust focus-visible:outline-none"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
