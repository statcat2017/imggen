type ToggleProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <label className="flex cursor-pointer min-h-11 items-center gap-3 px-1">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        className={`relative inline-flex h-5 w-10 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ctp-mauve/50 ${
          checked ? "bg-ctp-green" : "bg-ctp-surface0"
        }`}
      >
        <span
          className={`h-3.5 w-3.5 rounded-full bg-white self-center transition-transform mx-[3px] ${
            checked ? "translate-x-[18px]" : "translate-x-0"
          }`}
        />
      </span>
      <span className="text-ctp-text text-sm">{label}</span>
    </label>
  );
}
