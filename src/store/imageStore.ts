import { create } from "zustand";
import type { SourceImage } from "@/types";

type ImageStore = {
  source: SourceImage | null;
  setSource: (image: SourceImage) => void;
  clearSource: () => void;
};

export const useImageStore = create<ImageStore>((set) => ({
  source: null,

  setSource(image) {
    set((state) => {
      state.source?.bitmap.close();
      return { source: image };
    });
  },

  clearSource() {
    set((state) => {
      state.source?.bitmap.close();
      return { source: null };
    });
  },
}));
