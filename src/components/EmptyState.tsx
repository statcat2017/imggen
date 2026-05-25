import { Button } from "@/components/ui/Button";
import type { UploadState } from "@/hooks/useImageUpload";

type EmptyStateProps = {
  onBrowse: () => void;
  uploadState: UploadState;
};

export function EmptyState({ onBrowse, uploadState }: EmptyStateProps) {
  const isLoading = uploadState.status === "validating" || uploadState.status === "decoding";
  const isError = uploadState.status === "error";

  return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="border-2 border-dashed border-ctp-surface1 rounded-xl p-12 flex flex-col items-center gap-4 max-w-sm text-center">
        {isLoading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-ctp-mauve border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-ctp-subtext0">
              {uploadState.status === "validating"
                ? "Validating file\u2026"
                : "Decoding image\u2026"}
            </p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-ctp-red"
              role="img"
              aria-label="Error"
            >
              <title>Error</title>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-sm text-ctp-red">{uploadState.message}</p>
            <Button variant="primary" size="md" onClick={onBrowse}>
              Try again
            </Button>
          </div>
        ) : (
          <>
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
            <Button variant="primary" size="md" onClick={onBrowse}>
              Browse files
            </Button>
            <span className="text-ctp-overlay0 text-xs">PNG, JPG up to 25 MB</span>
          </>
        )}
      </div>
    </div>
  );
}
