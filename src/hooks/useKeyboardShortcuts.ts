import { useEffect } from "react";
import { useDisplayStore } from "@/store/displayStore";
import { useExportStore } from "@/store/exportStore";
import { useFilterStore } from "@/store/filterStore";

export function useKeyboardShortcuts() {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      const { viewActions } = useDisplayStore.getState();

      switch (e.key) {
        case " ":
          e.preventDefault();
          useDisplayStore.getState().setTempMode("original");
          break;
        case "b":
        case "B":
          useDisplayStore.getState().cycleMode();
          break;
        case "r":
        case "R":
          useFilterStore.getState().reset();
          break;
        case "+":
        case "=":
          viewActions.zoomIn();
          break;
        case "-":
          viewActions.zoomOut();
          break;
        case "0":
          viewActions.resetZoom();
          break;
        case "e":
        case "E":
          useExportStore.getState().requestFocusExport();
          break;
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      if (e.key === " ") {
        useDisplayStore.getState().setTempMode(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);
}
