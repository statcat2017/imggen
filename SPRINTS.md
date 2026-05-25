# imggen — Sprint Plan

## Overview

8 sprints over ~4–6 weeks. Each sprint has a clear deliverable, acceptance criteria, and a landmark that can be pushed and demoed.

---

## Sprint 1: Empty Shell & UI Skeleton

**Landmark:** App renders full UI at `imggen.statcat.co.uk`. Nothing works yet, but everything is present and responsive.

### Tasks

- [ ] **AppShell layout** — Full-page app shell with dark theme. Top toolbar (logo, Upload button, Preset dropdown, Export button, Help). Main preview stage area. No routing needed (single-page).
- [ ] **Empty state** — Drag-and-drop zone with icon, supported formats text, max file size note, and "Upload a PNG or JPG photo and turn it into a cell-shaded adventure-game asset." copy.
- [ ] **FilterControlsPanel** — Floating bottom panel anchored to the image preview area. Collapsible to a 44px tab. Translucent dark background with backdrop blur where supported. Sections: Look, Lines, Cleanup, Export.
- [ ] **UI primitives** — `Slider` (with label, visible numeric value, double-click-to-reset), `Toggle` (with label), `Select` (dropdown), `Button` (primary/secondary variants), `ColorPicker` (with hex text input fallback).
- [ ] **Responsive layout** — Desktop: panel anchored to image preview bottom (§6.2). Below 768px: panel switches to a viewport-fixed bottom sheet (§6.1). This is the canonical behaviour — §6.2's image-anchoring applies to desktop only.

### Requirements

- All 12 filter controls from spec §5.3 rendered in the panel (non-functional).
- Preset selector dropdown shows 5 built-in presets (non-functional).
- Panel height: 44px collapsed, 160–260px expanded. Max width 900px, min 320px.
- Mobile: bottom sheet, finger-friendly sliders (min 44px touch targets).
- No console errors on any supported viewport.

### Dependencies

- Zustand stores scaffolded (already done).
- Tailwind CSS configured (already done).

---

## Sprint 2: Image Loading & Preview

**Landmark:** Upload a JPG or PNG file → it appears in a zoomable, pannable canvas preview.

### Tasks

- [ ] **UploadZone** — File picker via `<input type="file">` with `accept="image/png,image/jpeg,.jpg"`. Drag-and-drop with visual feedback (border highlight). Clipboard paste handler (`Ctrl+V` / `Cmd+V`).
- [ ] **Validation** — MIME type check against `image/png` and `image/jpeg`. File size cap at 25 MB (§5.1). Corrupt image detection (graceful decode failure). All errors shown inline, not as browser alerts (§6.5).
- [ ] **useImageUpload hook** — Wires upload → `validateFile()` → `decodeImage()` → `imageStore.setSource()`. Returns upload state: `idle | validating | decoding | done | error`.
- [ ] **PreviewStage** — Responsive canvas that fits image to available space while preserving aspect ratio. Canvas size recalculates on window resize. Checkerboard background for transparency.
- [ ] **Zoom and pan** — Mouse wheel zoom (toward cursor). Click-drag to pan. Pinch-to-zoom on touch. Reset zoom button (or `0` key) returns to fit-to-screen. Clamp zoom range (0.25x–5x).
- [ ] **Metadata display** — Below or within the toolbar: file name, original dimensions (W × H), file size (formatted). From `SourceImage` type.
- [ ] **renderPreview stub** — Draws the original `ImageBitmap` to the preview canvas at the correct position/zoom. No filtering applied yet.

### Requirements

- Upload flow under 1 second for a 1920px image (§13).
- Bitmap lifecycle: `bitmap.close()` called when source is replaced or cleared. `SourceImage.bitmap` is a live GPU/CPU reference — never serialised, never persisted (§6.8 concern from feedback).
- Unsupported file, oversize, and corrupt states display specific error messages inline.
- Drop zone highlights on `dragover`, hides on `dragleave`/`drop`.

### Dependencies

- `imageDecoder.ts` (already scaffolded — `validateFile`, `decodeImage`, `formatFileSize`).
- `imageStore` (already scaffolded — `setSource`, `clearSource`).

---

## Sprint 3: Canvas 2D Cell-Shading Pipeline

**Landmark:** Any uploaded image renders with the "Adventure Background" preset. All 6 pipeline passes work on CPU. No live controls yet — just hardcoded default settings render.

### Tasks

- [ ] **`posterize()`** — Channel-based colour quantisation. Convert each RGB channel to a discrete band: `floor(channel * (levels - 1) + 0.5) / (levels - 1)`. Operates on `ImageData`.
- [ ] **`smooth()`** — Box blur (3×3 kernel) for noise reduction. Gaussian blur if performance permits; bilateral filter deferred to future sprint.
- [ ] **`colorCorrect()`** — Contrast adjustment: `(color - 0.5) * contrast + 0.5 + shadowBias`. Saturation: convert to HSL, multiply S, convert back. Preserve alpha channel. Clamp to 0–255.
- [ ] **`edgeDetect()`** — Convert image to luminance (BT.709: `0.2126R + 0.7152G + 0.0722B`). Sobel operator: horizontal and vertical 3×3 kernels. Combine gradient magnitude: `sqrt(Gx² + Gy²)`. Threshold against `edgeThreshold`: output `edgeStrength` where magnitude > threshold, 0 otherwise.
- [ ] **`composite()`** — Blend edge mask (using `lineColour`) over the posterised-colour-corrected base. Use alpha blending: `base * (1 - edgeAlpha) + lineColour * edgeAlpha`. Edge thickness applied before compositing (dilate edge mask).
- [ ] **Pipeline orchestrator** — Runs passes in order: decode → smooth → colorCorrect → posterize → luminance → edgeDetect → dilateEdges → composite. Each pass takes `ImageData` in, returns `ImageData` out.
- [ ] **RenderController** — Calls the pipeline, draws final `ImageData` to the preview canvas. Handles `renderPreview()` with settings and canvas target.

### Requirements

- Output must be deterministic — same input + same settings = same output every time.
- All passes preserve alpha channel where applicable.
- Edge dilation via repeated morphological dilate (3×3 kernel). Canvas 2D path caps at 2px effective dilation. (Full 8px range requires WebGL — see Sprint 5 capability matrix.)
- Reference images validated visually against spec descriptions (Adventure Background: moderate outlines, soft smoothing, 6–8 colour bands, boosted saturation).

### Dependencies

- Pipeline function stubs (already scaffolded in `src/rendering/pipeline/`).
- `RenderController` (already scaffolded).

---

## Sprint 4: Interactive Controls & Presets

**Landmark:** Drag any slider → cell-shaded preview updates in real time under 100ms at 1920px. Preset dropdown switches all params at once.

### Tasks

- [ ] **Filter controls → store** — Each slider/toggle/color picker reads from and writes to `filterStore`. Slider drag emits `onChange` to `filterStore.update({ key: value })`.
- [ ] **presetId semantics** — `presetId` is `string | null`. `null` = settings no longer match any built-in preset (user has drifted a slider). `applyPreset()` sets preset ID. `update()` sets it to `null`. Preset selector label shows format: "Adventure Background" (exact match) or "Custom (from Adventure Background)" (drifted) or "Custom" (started from default).
- [ ] **Render scheduling** (§9.4) — Changes queue a render request via `requestAnimationFrame`. If another change arrives before the frame, replace the pending request (only newest settings rendered). Stale renders are silently dropped.
- [ ] **Throttle/debounce** — UI updates immediately (no stutter). `requestAnimationFrame` coalescing prevents render storms. Optional: skip smoothing recalc if only `contrast` or `saturation` changed.
- [ ] **Pass caching** — Cache: smoothed image (invalidated on `smoothing` change), luminance map + edge mask (invalidated on `edgeThreshold`/`edgeStrength`/`edgeThickness`/`smoothing` change), posterised result (invalidated on `colourLevels` change). Composite pass always re-runs (cheap).
- [ ] **5 built-in presets** — Dropdown applies `presetStore.applyPreset(id)`, which sets all 12 params atomically. Presets loaded from `builtInPresets.ts`.
- [ ] **Reset behaviour** — Double-click any slider → reset to preset default value. Global "Reset" button → restore active preset values. If `presetId` is null, reset to `adventure-background`.
- [ ] **useRenderController hook** — Subscribes to `filterStore` and `imageStore`. On source or settings change, queues a render. Returns render status.

### Requirements

- Slider update → preview frame within 100ms for 1920px images on desktop (§13).
- UI frame rate stays at 30–60 fps while dragging sliders (§13).
- `requestAnimationFrame` scheduling — no more than one render per frame regardless of slider frequency.
- Pass cache keyed by parameter group; cache invalidated only when relevant params change.
- LocalStorage persists last-used filter settings (already implemented in `filterStore`).

### Dependencies

- `filterStore`, `presetStore` (already scaffolded with localStorage persistence).
- `builtInPresets.ts` (already scaffolded with all 5 presets).
- `RenderController.renderPreview()` from Sprint 3.

---

## Sprint 5: WebGL2 Acceleration

**Landmark:** GPU pipeline rendering 2–5× faster than Canvas 2D. Falls back to Canvas 2D when WebGL2 unavailable.

### Tasks

- [ ] **GLSL fragment shaders** — Write and test against Canvas 2D reference output:
  - `posterize.frag` — Colour quantisation on GPU.
  - `edgeDetect.frag` — Sobel operator in fragment shader.
  - `smooth.frag` — Box blur via separable 2-pass (horizontal then vertical).
  - `colorCorrect.frag` — Contrast, saturation, shadow bias.
  - `composite.frag` — Edge mask blend over base.
- [ ] **WebGLRenderer class** — Compiles shader programs at init. Creates framebuffers for each pass. Uploads source to `TEXTURE0`. Runs passes as render-to-texture chain. Reads final output to canvas.
- [ ] **Capability matrix enforcement** — Document the limits of each backend:

  | Capability | Canvas 2D | WebGL2 |
  |---|---|---|
  | Edge dilation (max effective) | 2px | 8px (full range) |
  | Real-time at 1920px | 100–200ms | ~16ms |
  | Real-time at 4K | 500ms+ (unusable) | ~40ms |
  | Smoothing quality | Box blur only | Gaussian/bilateral capable |
  | Export at original res | Works (slow) | Works (fast) |

  Canvas 2D path silently clamps edge thickness to 2px and uses box blur regardless of requested quality. The UI should indicate this when applicable (e.g. "Edge thickness limited to 2px in software mode").

- [ ] **Feature detection** — On app init, check `canvas.getContext("webgl2")`. If available → use `WebGLRenderer`. If not → use `Canvas2DRenderer`. Graceful message: "Your browser doesn't support hardware acceleration. Using software rendering with reduced quality."
- [ ] **`vite-plugin-glsl` integration** — Import `.frag` files as strings via the already-configured plugin.
- [ ] **Benchmark** — Measure preview render time for both backends at 1920px and 3840px. Log to console in dev mode. Use as verification that the GPU path is actually faster.

### Requirements

- WebGL preview at 1920px: under 16ms (60 fps target).
- Canvas 2D fallback works in all 4 target browsers without errors.
- Shader compilation errors caught at init time with descriptive messages.
- **readPixels note** — `readPixels` is synchronous and will block. For 4K export, render to framebuffer, read once at the end (not per-pass). If `OffscreenCanvas` + worker available, use `transferToImageBitmap` to avoid GPU→CPU copy blocking the main thread.
- WebGL context loss handled: show "Rendering paused" message, reinit when context restored.

### Dependencies

- GLSL shader files (directory already exists: `src/rendering/shaders/`).
- `WebGLRenderer` stub (already scaffolded).
- Canvas 2D pipeline from Sprint 3 (serves as correctness reference).

---

## Sprint 6: Export Pipeline

**Landmark:** Export button works. PNG download at original resolution. JPEG export with quality control.

### Tasks

- [ ] **PNG export** — Render at target resolution → `canvas.toBlob("image/png")` → trigger download. Filename: `{original-name}-cellshaded.png`.
- [ ] **JPEG export** — Quality slider (0.1–1.0, default 0.92). Canvas with white background (JPEG can't do alpha). `canvas.toBlob("image/jpeg", quality)`.
- [ ] **Resolution options** — Dropdown: Original | Preview | Custom. Custom reveals W×H inputs with aspect ratio lock toggle.
- [ ] **Aspect ratio lock** — On by default. Changing width recalculates height (and vice versa) based on source image ratio.
- [ ] **ExportService** — Runs the full pipeline at target resolution. Uses same settings and equivalent passes as preview but at higher quality (no downscaling, full smoothing passes). Separate offscreen canvas from preview canvas.
- [ ] **Export-during-preview interaction** — If export fires while a preview render is in flight:
  1. Cancel the in-progress preview render.
  2. Start export on its own offscreen canvas.
  3. Block new preview renders until export completes or errors.
  4. `RenderController` status enum: `idle | preview | exporting | cancelled`.
  5. After export finishes, resume normal preview rendering.
- [ ] **Export progress UI** — Status text: "Rendering full-resolution export…" with a progress indicator. Runs the pipeline pass-by-pass, reporting progress.
- [ ] **Sharpen after resize** — Toggle, default off. Uses unsharp mask: 3×3 convolution kernel as final pass before blob creation. Only applied during export, never on live preview.
- [ ] **Transparency handling** — PNG input with alpha → preserve alpha in PNG export. For JPEG export, composite onto white background.

### Requirements

- Export at 1920px: under 3 seconds (§13).
- Export at 4K: under 10 seconds. Note: `readPixels` is the bottleneck here (see Sprint 5 note). Use single framebuffer read.
- Export dimensions: max 4096px on longest side (same cap as preview). Warn if user requests larger.
- Filename sanitised: strip path separators, limit length, ensure extension is `.png` or `.jpg`.
- Download triggered via `<a>` click with `URL.createObjectURL`; revoked after download starts.

### Dependencies

- Full rendering pipeline (Sprint 3 + Sprint 5).
- `ExportService` stub (already scaffolded).
- `filename.ts` utility (already scaffolded — `generateExportFilename`).

---

## Sprint 7: Polish & UX

**Landmark:** App feels like a real creative tool. Before/after comparison, custom presets, keyboard shortcuts all work.

### Tasks

- [ ] **Before/after comparison** — Three modes:
  - Press-and-hold Space: show original while held.
  - Toggle B: switch between processed and original view (persistent).
  - Split-screen slider: draggable vertical divider, left = original, right = processed.
- [ ] **Custom presets** — "Save current as preset" button in panel. Prompts for name. Saved to `presetStore.custom[]` and persisted to localStorage. Rename and delete via preset manager UI (small gear icon next to preset dropdown).
- [ ] **Preset export/import** — Export custom presets as `.json` file download. Import via file picker, merge into custom presets (skip duplicates by ID).
- [ ] **Keyboard shortcuts** (spec §5.8):
  - `Space` held → show original.
  - `B` → toggle before/after split.
  - `R` → reset current preset.
  - `+` / `=` → zoom in.
  - `-` → zoom out.
  - `0` → reset zoom.
  - `E` → export.
  - `H` → hide/show control panel.
- [ ] **Empty state polish** — Animated drop zone border (pulsing dash). Optional: 3 sample images the user can click to test the tool instantly (bundled as static assets in `public/samples/`).
- [ ] **Loading states** — Status bar text during operations:
  - "Decoding image…" (after file selected, before bitmap ready).
  - "Building preview…" (during first render).
  - Spinner in export button during export.

### Requirements

- Keyboard shortcuts documented in the app (small `?` icon in toolbar → shortcut reference modal).
- Custom presets survive page reload (localStorage).
- Holding Space must feel instant (pre-render original to a cached texture/canvas on load).
- All three before/after modes work on mobile (split slider replaced with tap-to-toggle).

### Dependencies

- `presetStore` (already scaffolded with `saveCustom`, `deleteCustom`, `loadCustomPresets`).
- Preview + original canvas caching from Sprint 2.

---

## Sprint 8: Testing, Accessibility & Production Readiness

**Landmark:** Test suite passes on all 4 target browsers. App is keyboard-navigable, accessible, and deployable.

### Tasks

- [ ] **Unit tests** (Vitest):
  - `validateFile()` — supported types pass, unsupported fail, oversize fail.
  - `generateExportFilename()` — extension replacement, special chars.
  - `clamp()` — boundary values.
  - `FilterSettings` defaults match "Adventure Background" preset.
  - Preset application overwrites all fields atomically.
  - `presetId` null on `update()`, restored on `applyPreset()`.
  - LocalStorage round-trip for settings and custom presets.
- [ ] **Rendering snapshot tests** — 8 fixture images (§15.2): high-contrast photo, low-light photo, landscape/street scene, portrait, transparent PNG, very wide background, very tall image, noisy phone photo. Run pipeline with Adventure Background preset; compare output ImageData against stored snapshot with 2% tolerance per channel.
- [ ] **E2E tests** (Playwright):
  - Upload flow: click upload → file picker → image appears.
  - Drag-and-drop: drag file onto drop zone → image appears.
  - Slider interaction: drag edge strength → preview updates.
  - Preset switching: select Comic Ink → params snap, preview rerenders.
  - Before/after toggle: press B → split view appears.
  - Export: click export → download triggers with correct filename.
  - Error state: upload a `.gif` → inline error message.
  - Mobile viewport: 375×812 → bottom sheet layout present, sliders finger-friendly.
- [ ] **Performance tests** — Measure and assert:
  - Time from upload to first preview (1920px): < 1s.
  - Time from slider input to rendered frame: < 100ms.
  - Export at 1920px: < 3s.
  - Memory usage after loading 4096px image: doesn't exceed 2× image size in JS heap.
  - Main thread blocked time during slider drag: < 16ms per frame.
- [ ] **Accessibility** (§11):
  - All controls keyboard-accessible (Tab, arrow keys for sliders, Enter/Space for buttons).
  - Sliders have `<label>` elements and visible numeric values.
  - Colour picker includes hex text input for screen-reader users.
  - Error/active states not communicated by colour alone (use icons + text).
  - Floating panel has sufficient contrast ratio (≥ 4.5:1 for text, ≥ 3:1 for UI controls).
  - `prefers-reduced-motion` respected: no animated borders, instant panel transitions.
- [ ] **Cross-browser manual check** — Chrome, Firefox, Safari, Edge. Verify: WebGL2 works on all (fallback to Canvas 2D on any that fail). Clipboard paste works where supported. Drag-and-drop works on all.
- [ ] **Deduplication** — Remove §5.3 "Numeric values should be visible beside sliders" requirement (already covered in §11). Accessibility requirements live in §11 only.

### Requirements

- All unit tests pass (`npm test` exits 0).
- All rendering snapshot tests pass within tolerance.
- Playwright tests pass on Chromium and Firefox (WebKit optional for V1).
- Lighthouse accessibility score ≥ 90.
- `npm run build` produces a deployable `dist/` directory with no errors.

### Dependencies

- `vitest.config.ts` (already configured with jsdom and `src/**/*.test.{ts,tsx}` pattern).
- `test-setup.ts` (already scaffolded with `@testing-library/jest-dom/vitest`).
- Playwright needs to be installed (`npx playwright install`).

---

## Summary

| Sprint | Focus | Deliverable | Est. |
|---|---|---|---|
| 1 | UI Shell | Full UI renders, nothing functional | 2–3 days |
| 2 | Image loading & preview | Upload → zoomable canvas | 2–3 days |
| 3 | Canvas 2D pipeline | Cell-shading works on CPU | 3–5 days |
| 4 | Interactive controls & presets | Live sliders, preset switching | 3–4 days |
| 5 | WebGL2 acceleration | GPU pipeline + capability matrix | 3–5 days |
| 6 | Export | PNG/JPEG download at selectable res | 2–3 days |
| 7 | Polish & UX | Before/after, custom presets, shortcuts | 2–3 days |
| 8 | Testing, a11y, production | Test suite green, accessible, deploy | 3–5 days |
| **Total** | | | **~4–6 weeks** |

### Risk Register

| Risk | Impact | Mitigation |
|---|---|---|
| Canvas 2D too slow for real-time | Sprint 4 blocks on perf | Lower preview resolution during slider drag (0.5×), render full-res on release |
| WebGL shader bugs differ from Canvas 2D | Sprint 5 produces different output | Sprint 3 renders reference snapshots first; Sprint 5 tests against those same snapshots |
| Edge dilation expensive on CPU | Sprint 3 slow | Canvas 2D caps at 2px; UI warns above 2px in software mode as documented in capability matrix |
| readPixels blocking on 4K export | Sprint 6 slow export | Single framebuffer read at end; worker + transferToImageBitmap where supported |
| Mobile layout untested early | Sprint 8 late catch | Quick sanity check on mobile viewport at end of Sprint 1 and Sprint 2 |
| Preset drift confusion | Sprint 4 UX unclear | presetId null semantics defined upfront; "(modified)" label in dropdown |

### Sprint Boundaries

- **Sprint 1–2 can partially overlap.** UI primitives (Sprint 1) can be built while upload logic (Sprint 2) is developed, as they don't depend on each other.
- **Sprint 3 must complete before Sprint 4** — the pipeline must render *something* before sliders can control it.
- **Sprint 5 is a drop-in replacement for Sprint 3's renderer** — the `RenderController` interface stays the same; only the internal renderer changes. Sprint 4 (controls) should work with either backend.
- **Sprint 6 can start as soon as Sprint 3 completes** — export uses the same pipeline but at higher resolution. WebGL (Sprint 5) makes it faster but isn't required.
- **Sprint 7 and 8 can overlap** — write tests while polish features are built. Playwright tests for before/after modes can be written in Sprint 7, run in Sprint 8.

### Developer Handoff

To start Sprint 1, the developer needs only:
1. Clone the repo.
2. `npm install && npm run dev`.
3. Build UI components per Sprint 1 checklist.
4. Reference `src/types/index.ts` for the full data model.
5. Reference `src/presets/builtInPresets.ts` for preset values.
