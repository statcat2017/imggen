import { Button } from "@/components/ui/Button";

export function EmptyState() {
  return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="border-2 border-dashed border-ctp-surface1 rounded-xl p-12 flex flex-col items-center gap-4 max-w-sm text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-ctp-overlay0"
          role="img"
          aria-label="Upload"
        >
          <title>Upload</title>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <h2 className="text-xl font-semibold text-ctp-text">Drop your image here</h2>
        <p className="text-sm text-ctp-subtext0">
          Upload a PNG or JPG photo and turn it into a cell-shaded adventure-game asset.
        </p>
        <Button variant="primary" size="md">
          Browse files
        </Button>
        <span className="text-ctp-overlay0 text-xs">PNG, JPG up to 25 MB</span>
      </div>
    </div>
  );
}
