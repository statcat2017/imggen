import { useCallback, useState } from "react";
import { Button } from "@/components/ui/Button";
import { HelpModal } from "@/components/HelpModal";
import { useExportStore } from "@/store/exportStore";

type ToolbarProps = {
  onUploadClick: () => void;
};

export function Toolbar({ onUploadClick }: ToolbarProps) {
  const [helpOpen, setHelpOpen] = useState(false);
  const isExporting = useExportStore((s) => s.status) === "exporting";
  const requestFocusExport = useExportStore((s) => s.requestFocusExport);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") setHelpOpen(false);
  }, []);

  return (
    <header
      className="h-14 border-b border-ctp-surface1 bg-ctp-base/80 backdrop-blur flex items-center px-4 shrink-0"
      onKeyDown={handleKeyDown}
    >
      <span className="text-ctp-mauve font-bold text-lg tracking-tight">imggen</span>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="primary" size="sm" onClick={onUploadClick}>
          Upload
        </Button>
        <Button variant="secondary" size="sm" onClick={requestFocusExport} disabled={isExporting}>
          {isExporting ? "Exporting\u2026" : "Export"}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setHelpOpen(true)} aria-label="Help">
          ?
        </Button>
      </div>
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </header>
  );
}
