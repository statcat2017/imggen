import { useCallback, useRef, useState } from "react";
import { decodeImage, ImageDecodeError, validateFile } from "@/services/imageDecoder";
import { useImageStore } from "@/store/imageStore";

export type UploadState =
  | { status: "idle" }
  | { status: "validating" }
  | { status: "decoding" }
  | { status: "done" }
  | { status: "error"; message: string };

export function useImageUpload() {
  const setSource = useImageStore((s) => s.setSource);
  const [state, setState] = useState<UploadState>({ status: "idle" });
  const uploadIdRef = useRef(0);

  const upload = useCallback(
    async (file: File) => {
      const id = ++uploadIdRef.current;
      setState({ status: "validating" });
      try {
        validateFile(file);
      } catch (e) {
        const message = e instanceof ImageDecodeError ? e.message : "Failed to process image.";
        setState({ status: "error", message });
        return;
      }

      setState({ status: "decoding" });
      try {
        const image = await decodeImage(file);
        if (id !== uploadIdRef.current) {
          image.bitmap.close();
          return;
        }
        setSource(image);
        setState({ status: "done" });
      } catch (e) {
        if (id !== uploadIdRef.current) return;
        const message =
          e instanceof ImageDecodeError
            ? e.message
            : "Failed to decode image. The file may be corrupted.";
        setState({ status: "error", message });
      }
    },
    [setSource],
  );

  const reset = useCallback(() => {
    setState({ status: "idle" });
  }, []);

  return { upload, state, reset };
}
