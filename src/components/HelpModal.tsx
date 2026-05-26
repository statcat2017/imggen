import { useEffect } from "react";

const shortcuts = [
  { key: "Space", action: "Hold to show original image" },
  { key: "B", action: "Toggle before/after comparison" },
  { key: "R", action: "Reset current preset" },
  { key: "+ / =", action: "Zoom in" },
  { key: "\u2212", action: "Zoom out" },
  { key: "0", action: "Reset zoom" },
  { key: "E", action: "Focus export panel" },
];

type HelpModalProps = {
  open: boolean;
  onClose: () => void;
};

export function HelpModal({ open, onClose }: HelpModalProps) {
  useEffect(() => {
    if (!open) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ctp-crust/60 backdrop-blur-sm"
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div
        className="bg-ctp-mantle border border-ctp-surface1 rounded-xl shadow-2xl max-w-md w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-ctp-text font-semibold text-lg">Keyboard Shortcuts</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-ctp-subtext0 hover:text-ctp-text cursor-pointer text-xl leading-none"
            aria-label="Close"
          >
            {"\u2715"}
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {shortcuts.map(({ key, action }) => (
            <div key={key} className="flex items-center gap-3 text-sm">
              <kbd className="bg-ctp-surface0 text-ctp-text px-2 py-0.5 rounded font-mono text-xs min-w-[4rem] text-center">
                {key}
              </kbd>
              <span className="text-ctp-subtext1">{action}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
