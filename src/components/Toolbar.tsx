import { Button } from "@/components/ui/Button";

type ToolbarProps = {
  onUploadClick: () => void;
};

export function Toolbar({ onUploadClick }: ToolbarProps) {
  return (
    <header className="h-14 border-b border-ctp-surface1 bg-ctp-base/80 backdrop-blur flex items-center px-4 shrink-0">
      <span className="text-ctp-mauve font-bold text-lg tracking-tight">imggen</span>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="primary" size="sm" onClick={onUploadClick}>
          Upload
        </Button>
        <Button variant="secondary" size="sm">
          Export
        </Button>
        <Button variant="ghost" size="sm">
          ?
        </Button>
      </div>
    </header>
  );
}
