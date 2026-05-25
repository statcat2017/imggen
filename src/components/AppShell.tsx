import { type ChangeEvent, useRef } from "react";
import { EmptyState } from "@/components/EmptyState";
import { FilterControlsPanel } from "@/components/FilterControlsPanel";
import { Metadata } from "@/components/Metadata";
import { PreviewStage } from "@/components/PreviewStage";
import { Toolbar } from "@/components/Toolbar";
import { UploadZone } from "@/components/UploadZone";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useImageStore } from "@/store/imageStore";

export function AppShell() {
  const source = useImageStore((s) => s.source);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { upload, state, reset } = useImageUpload();

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) upload(file);
    e.target.value = "";
  }

  const showError = state.status === "error" && !!source;

  return (
    <div className="h-full flex flex-col bg-ctp-crust">
      <Toolbar onUploadClick={openFilePicker} />
      {source && <Metadata />}
      <main className="flex-1 relative min-h-0">
        <input
          ref={fileInputRef}
          type="file"
          hidden
          accept="image/png,image/jpeg,.jpg"
          onChange={handleFileChange}
        />
        {showError && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 bg-ctp-mantle border border-ctp-red/50 rounded-lg px-4 py-2 flex items-center gap-3 text-sm shadow-lg max-w-md">
            <span className="text-ctp-red shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                role="img"
                aria-label="Error"
              >
                <title>Error</title>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </span>
            <span className="text-ctp-text flex-1">{state.message}</span>
            <button
              type="button"
              onClick={reset}
              className="text-ctp-subtext0 hover:text-ctp-text cursor-pointer shrink-0 leading-none"
            >
              {"\u2715"}
            </button>
          </div>
        )}
        <UploadZone onFileDrop={upload}>
          {source ? <PreviewStage /> : <EmptyState onBrowse={openFilePicker} uploadState={state} />}
        </UploadZone>
        <FilterControlsPanel />
      </main>
    </div>
  );
}
