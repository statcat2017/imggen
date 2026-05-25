# Technical Specification: Cell-Shaded Image Filtering Web App

## 1. Product Summary

Build a browser-based image filtering tool that allows users to upload PNG or JPG/JPEG photos, apply adjustable cell-shaded/cartoon rendering effects, preview changes in real time, and export the processed images for use in a point-and-click adventure game.

The app should feel like a lightweight creative tool: upload an image, tune the look using a compact control panel overlaid at the bottom of the image, and immediately see the result update without page reloads or server-side processing.

## 2. Goals

### 2.1 Primary Goals

- Allow users to upload PNG and JPG/JPEG images.
- Display the uploaded image in a large central preview area.
- Apply a configurable cell-shaded effect in real time.
- Provide a small parameter window at the bottom of the image for effect controls.
- Allow users to export/download the processed image as PNG and optionally JPG.
- Preserve enough image quality for use as game backgrounds, character portraits, inventory objects, or scene assets.
- Keep all processing local in the browser for speed and privacy.

### 2.2 Secondary Goals

- Support presets for common point-and-click adventure styles.
- Allow before/after comparison.
- Support multiple output resolutions.
- Support drag-and-drop upload.
- Remember the last-used settings locally.
- Support batch processing in a later version.

### 2.3 Non-Goals for Version 1

- No user accounts.
- No cloud storage.
- No server-side image processing.
- No AI generation or semantic image editing.
- No animation/video filtering.
- No layered Photoshop-style editing.
- No full asset-management system.

## 3. Target Users

### 3.1 Primary User

An indie game developer or artist creating assets for a point-and-click adventure game who wants to convert real-world photos into stylised painted/cartoon/cell-shaded backgrounds.

### 3.2 Use Cases

- Convert a photo of a street, pub, train station, room, alley, office, or landscape into a stylised game background.
- Create consistent-looking scene references from location scouting photos.
- Produce rough concept art quickly before handing assets to an artist.
- Process item or character reference photos into a flatter, more illustrated style.

## 4. Core User Journey

1. User opens the web app.
2. User uploads an image by clicking an upload button or dragging a PNG/JPG file into the drop zone.
3. The image appears in the central preview canvas.
4. A compact controls panel appears at the bottom of the preview image.
5. User adjusts cell-shading parameters such as colour levels, edge thickness, contrast, smoothing, and saturation.
6. The preview updates in real time while sliders are moved.
7. User compares the result against the original.
8. User exports the final processed image.

## 5. Functional Requirements

## 5.1 Image Upload

### Requirements

- Accept the following file types:
  - `.png`
  - `.jpg`
  - `.jpeg`
- Support upload via:
  - File picker.
  - Drag-and-drop.
  - Paste from clipboard, if supported by browser.
- Reject unsupported formats with a clear message.
- Validate file size before processing.
- Display upload progress or loading state for large files.
- Show image metadata after upload:
  - File name.
  - Original dimensions.
  - File size.
  - MIME type.

### Constraints

- Recommended maximum file size for V1: 25 MB.
- Recommended maximum processed dimension for real-time preview: 4096 px on the longest side.
- Very large images should be downscaled for preview but retain an option to export at original resolution where feasible.

### Error States

- Unsupported file type.
- File too large.
- Image decode failure.
- Browser memory limitation.
- Corrupt image.

## 5.2 Image Preview

### Requirements

- Display the uploaded image in a central responsive canvas.
- Fit image to available screen while preserving aspect ratio.
- Allow zooming and panning.
- Provide reset zoom button.
- Support a checkerboard or neutral background for transparency.
- Keep the bottom controls panel overlaid on the image without permanently covering export output.

### View Modes

- Processed view.
- Original view.
- Split-screen before/after view.
- Press-and-hold original preview toggle.

## 5.3 Cell-Shaded Effect Controls

The controls should appear in a compact floating window anchored to the bottom centre of the image preview.

### Required Controls for V1

| Control | Type | Default | Range | Description |
|---|---:|---:|---:|---|
| Style Preset | Dropdown | Adventure Background | N/A | Selects grouped parameter values. |
| Colour Levels | Slider | 6 | 2–16 | Number of posterised colour bands. |
| Edge Strength | Slider | 0.65 | 0–1 | Strength of detected outlines. |
| Edge Thickness | Slider | 1.5 px | 0–8 px | Visual width of outlines. |
| Edge Threshold | Slider | 0.25 | 0–1 | Sensitivity of outline detection. |
| Smoothing | Slider | 0.35 | 0–1 | Reduces photo noise before posterisation. |
| Contrast | Slider | 1.1 | 0.5–2 | Adjusts tonal punch. |
| Saturation | Slider | 1.15 | 0–2 | Adjusts colour intensity. |
| Shadow Bias | Slider | 0.0 | -1–1 | Pushes midtones darker or lighter. |
| Line Colour | Colour picker | #111111 | N/A | Colour of generated outlines. |
| Background Preservation | Toggle | On | Boolean | Reduces excessive outlines in low-detail areas. |
| Transparent Output | Toggle | Preserve input | Boolean | Preserves alpha channel for PNG input. |

### Presets

V1 should include the following presets:

1. **Adventure Background**
   - Moderate outlines.
   - Soft smoothing.
   - Slightly boosted saturation.
   - 6–8 colour bands.

2. **Comic Ink**
   - Strong outlines.
   - Higher contrast.
   - 4–6 colour bands.

3. **Soft Painted**
   - Low outlines.
   - Higher smoothing.
   - 8–12 colour bands.

4. **Pixel-Friendly Flat**
   - Low detail.
   - Strong colour reduction.
   - Reduced gradients.

5. **Dark Neo-Noir**
   - Strong contrast.
   - Darker shadows.
   - Slight desaturation.
   - Heavy black outlines.

### Control Behaviour

- Sliders should update the preview live while dragging.
- Expensive updates should be throttled or debounced to avoid UI lag.
- Numeric values should be visible beside sliders.
- Double-clicking a control should reset it to its preset default.
- A global reset button should restore the active preset.
- Users should be able to save custom presets locally.

## 5.4 Rendering Pipeline

The cell-shaded effect should be implemented as a deterministic image-processing pipeline.

### Pipeline Overview

1. Decode uploaded image into an image bitmap.
2. Draw source image to an internal canvas or GPU texture.
3. Optionally downscale for real-time preview.
4. Apply pre-processing:
   - Gamma correction.
   - Noise reduction / smoothing.
   - Contrast and saturation adjustment.
5. Apply colour quantisation/posterisation.
6. Detect edges.
7. Dilate or thicken edges according to edge thickness.
8. Blend outlines over posterised image.
9. Apply final colour correction.
10. Render output to preview canvas.
11. Export final canvas to Blob when requested.

### Recommended Algorithms

#### Posterisation / Colour Quantisation

For V1, use channel-based posterisation:

- Convert RGB values into a smaller number of discrete bands.
- Apply optional gamma-aware quantisation to avoid muddy shadows.
- Allow `colourLevels` to control band count.

Future versions may use palette quantisation such as median cut, k-means, or predefined game palettes.

#### Edge Detection

V1 should use a Sobel-style edge detection pass:

- Convert image to luminance.
- Calculate horizontal and vertical gradients.
- Combine gradient magnitude.
- Compare against `edgeThreshold`.
- Multiply result by `edgeStrength`.
- Render edge mask using selected line colour.

#### Edge Thickness

Edge thickness can be implemented by:

- Repeated dilation of the edge mask.
- Shader-based sampling of neighbouring pixels.
- Separable pass for performance.

#### Smoothing

Smoothing options:

- Fast box blur for V1.
- Gaussian blur for higher quality.
- Bilateral filter in a future version to smooth flat areas while preserving edges.

### Rendering Backend Options

#### Preferred V1 Implementation

Use WebGL2 where available, with Canvas 2D fallback.

WebGL2 is recommended because the effect is pixel-heavy and benefits from GPU acceleration. Canvas 2D fallback is acceptable for smaller images and browser compatibility.

#### Optional Future Backend

WebGPU can be explored later for higher-performance pipelines and larger batch jobs, but it should not be required for V1.

## 5.5 Real-Time Preview

### Requirements

- Preview should update within 100 ms after parameter changes on normal desktop hardware for images up to 1920 px on the longest side.
- Slider movement should remain smooth and not block the UI.
- For large images, preview should use a downscaled working image.
- Final export can use a higher-resolution pass.

### Performance Strategy

- Use a preview canvas resolution separate from export resolution.
- Use `requestAnimationFrame` for scheduling preview renders.
- Coalesce rapid slider changes into a single render operation.
- Use Web Workers and OffscreenCanvas where supported.
- Keep image processing off the main UI thread where possible.
- Cache intermediate results when only late-stage parameters change.

### Caching Opportunities

- Cache decoded source bitmap.
- Cache smoothed image if smoothing parameter has not changed.
- Cache luminance map for edge detection.
- Cache edge mask if edge parameters are unchanged.
- Cache posterised result if colour parameters are unchanged.

## 5.6 Export

### Requirements

- Export processed image as PNG.
- Optional export as JPG/JPEG with quality control.
- Export filename should default to:
  - `{original-name}-cellshaded.png`
- Allow export at:
  - Preview resolution.
  - Original resolution.
  - Custom width/height.
- Preserve aspect ratio by default.
- For PNG input with transparency, preserve transparency where possible.

### Export Options

| Option | Type | Default |
|---|---:|---:|
| Format | Dropdown | PNG |
| Resolution | Dropdown | Original |
| JPG Quality | Slider | 0.92 |
| Include Transparent Pixels | Toggle | On for PNG |
| Sharpen after resize | Toggle | Off |

## 5.7 Preset Management

### V1 Requirements

- Built-in presets are read-only.
- User can save current settings as a custom preset.
- User can rename or delete custom presets.
- Custom presets are saved in browser local storage.

### Future Requirements

- Export/import presets as JSON.
- Shareable preset links.
- Project-level preset libraries.

## 5.8 Keyboard and Mouse Shortcuts

| Shortcut | Action |
|---|---|
| Space held | Show original image temporarily. |
| B | Toggle before/after split. |
| R | Reset current preset. |
| + / = | Zoom in. |
| - | Zoom out. |
| 0 | Reset zoom. |
| E | Export. |
| H | Hide/show control panel. |

## 6. User Interface Specification

## 6.1 Layout

### Desktop Layout

- Full-page app shell.
- Top toolbar:
  - App name.
  - Upload button.
  - Export button.
  - Preset selector.
  - Help/about button.
- Main preview stage:
  - Large image canvas.
  - Zoom/pan support.
  - Optional before/after split handle.
- Bottom floating controls panel:
  - Semi-transparent dark or light panel.
  - Sliders arranged in two rows or collapsible sections.
  - Small enough to avoid dominating the image.
  - Can be collapsed to a thin tab.

### Mobile/Tablet Layout

- Preview remains primary.
- Controls panel becomes horizontally scrollable or opens as a bottom sheet.
- Sliders must remain finger-friendly.
- Export/upload actions remain fixed in top or bottom toolbar.

## 6.2 Bottom Parameter Window

### Requirements

- Anchored to bottom of the image preview, not the browser viewport.
- Max width: 900 px.
- Min width: 320 px.
- Height collapsed: 44 px.
- Height expanded: 160–260 px.
- Background: translucent with blur if browser supports it.
- Must not appear in exported image.
- Must be hideable for clean preview.
- Should show active preset name and render status.

### Suggested Panel Sections

1. **Look**
   - Preset.
   - Colour levels.
   - Contrast.
   - Saturation.
   - Shadow bias.

2. **Lines**
   - Edge strength.
   - Edge thickness.
   - Edge threshold.
   - Line colour.

3. **Cleanup**
   - Smoothing.
   - Background preservation.
   - Transparency.

4. **Export**
   - Format.
   - Resolution.
   - Export button.

## 6.3 Empty State

Before upload, show:

- Large drag-and-drop zone.
- Upload button.
- Short explanation: “Upload a PNG or JPG photo and turn it into a cell-shaded adventure-game asset.”
- Supported formats and max file size.
- Optional sample images.

## 6.4 Loading State

When processing:

- Show subtle spinner or progress bar.
- Keep current preview visible where possible.
- Show status text such as:
  - “Decoding image…”
  - “Building preview…”
  - “Rendering full-resolution export…”

## 6.5 Error State

Errors should be shown inline, not as browser alerts.

Examples:

- “That file type is not supported. Please upload a PNG or JPG image.”
- “This image is too large to preview in real time. A scaled preview has been created.”
- “Export failed because the browser ran out of memory. Try exporting at a smaller size.”

## 7. Technical Architecture

## 7.1 Recommended Stack

### Frontend

- React for component-based UI.
- TypeScript for safer image-processing configuration and state management.
- Vite for fast local development and static production builds.
- Zustand, Jotai, or React state for lightweight app state.
- WebGL2 fragment shaders for accelerated image filtering.
- Canvas 2D fallback for compatibility.
- Web Workers and OffscreenCanvas for heavy render tasks where supported.

### Deployment

- Static hosting is sufficient.
- Suitable platforms:
  - Cloudflare Pages.
  - Netlify.
  - Vercel static output.
  - GitHub Pages.

### Backend

No backend required for V1.

## 7.2 High-Level Architecture

```text
Browser App
├── UI Layer
│   ├── Upload controls
│   ├── Preview stage
│   ├── Bottom parameter panel
│   ├── Preset manager
│   └── Export controls
│
├── State Layer
│   ├── Source image metadata
│   ├── Active filter settings
│   ├── Preview state
│   ├── Export state
│   └── Custom presets
│
├── Rendering Layer
│   ├── Image decoder
│   ├── Preview renderer
│   ├── WebGL shader pipeline
│   ├── Canvas fallback pipeline
│   └── Export renderer
│
└── Persistence Layer
    ├── Local storage for presets
    └── Optional IndexedDB for recent images in future versions
```

## 7.3 Main Components

### `AppShell`

Responsible for global layout and routing between empty, loaded, and error states.

### `UploadZone`

Handles file picker, drag-and-drop, clipboard paste, validation, and image decoding.

### `PreviewStage`

Displays the canvas, manages zoom/pan, before/after modes, and positions the bottom control panel.

### `FilterControlsPanel`

Renders all sliders, toggles, colour pickers, preset selector, reset controls, and export shortcut.

### `PresetManager`

Loads built-in presets, saves custom presets, and applies selected presets.

### `RenderController`

Coordinates parameter changes, schedules renders, cancels outdated renders, and manages preview/export render modes.

### `WebGLRenderer`

Creates GPU textures, compiles shader programs, runs the image-processing passes, and draws final output to canvas.

### `Canvas2DRenderer`

Fallback renderer for browsers or environments where WebGL2 is unavailable.

### `ExportService`

Runs final render at requested output resolution and converts canvas output into downloadable file blobs.

## 8. Data Model

## 8.1 Filter Settings

```ts
export type FilterSettings = {
  presetId: string;
  colourLevels: number;
  edgeStrength: number;
  edgeThickness: number;
  edgeThreshold: number;
  smoothing: number;
  contrast: number;
  saturation: number;
  shadowBias: number;
  lineColour: string;
  preserveBackground: boolean;
  preserveTransparency: boolean;
};
```

## 8.2 Image Metadata

```ts
export type SourceImage = {
  id: string;
  fileName: string;
  mimeType: 'image/png' | 'image/jpeg';
  fileSizeBytes: number;
  width: number;
  height: number;
  hasAlpha: boolean;
  bitmap: ImageBitmap;
};
```

## 8.3 Preset

```ts
export type FilterPreset = {
  id: string;
  name: string;
  builtIn: boolean;
  description?: string;
  settings: FilterSettings;
};
```

## 8.4 Export Settings

```ts
export type ExportSettings = {
  format: 'png' | 'jpeg';
  jpegQuality: number;
  width: number;
  height: number;
  preserveAspectRatio: boolean;
  useOriginalResolution: boolean;
  sharpenAfterResize: boolean;
};
```

## 9. Rendering Details

## 9.1 Shader Passes

Recommended WebGL pass structure:

1. Source texture upload.
2. Smoothing pass.
3. Colour correction pass.
4. Posterisation pass.
5. Luminance pass.
6. Edge detection pass.
7. Edge thickness/dilation pass.
8. Composite pass.
9. Final draw pass.

## 9.2 Fragment Shader Parameters

Uniforms should include:

```glsl
uniform sampler2D u_source;
uniform vec2 u_resolution;
uniform float u_colourLevels;
uniform float u_edgeStrength;
uniform float u_edgeThickness;
uniform float u_edgeThreshold;
uniform float u_smoothing;
uniform float u_contrast;
uniform float u_saturation;
uniform float u_shadowBias;
uniform vec3 u_lineColour;
uniform bool u_preserveTransparency;
```

## 9.3 Preview vs Export Rendering

### Preview Render

- Uses downscaled source texture if source is large.
- Prioritises interactivity.
- Can skip highest-quality smoothing if necessary.
- Should update rapidly during slider changes.

### Export Render

- Uses original image dimensions or selected output size.
- Prioritises quality.
- Can run a slower version of smoothing and edge dilation.
- Shows progress/status while rendering.

## 9.4 Render Scheduling

Parameter changes should not immediately start expensive renders every time a slider emits a value. Instead:

1. User changes control.
2. State updates immediately.
3. Render request is queued.
4. If another change arrives before the next animation frame, replace the pending request.
5. Renderer processes the newest settings only.
6. Stale renders are cancelled or ignored.

## 10. State Management

## 10.1 Required State

- Current source image.
- Current filter settings.
- Active preset.
- Custom presets.
- Preview zoom and pan.
- Render status.
- Export status.
- Error messages.
- Before/after display mode.

## 10.2 Persistence

Persist in local storage:

- Last used filter settings.
- Custom presets.
- UI preferences such as collapsed panel state.

Do not persist uploaded images in V1 unless the user explicitly enables that in a future version.

## 11. Accessibility Requirements

- All controls must be keyboard accessible.
- Sliders must have labels and visible values.
- Buttons must have accessible names.
- Colour picker should include text input for hex value.
- Do not rely on colour alone to indicate active/error states.
- Ensure sufficient contrast in the floating controls panel.
- Provide reduced-motion behaviour for users who prefer it.

## 12. Security and Privacy

## 12.1 Privacy

- Images should remain local to the browser.
- No upload to a remote server in V1.
- No analytics events should include file names or image contents.
- Error reporting, if added later, must avoid image data and local file names.

## 12.2 Security

- Validate MIME type and file extension.
- Decode images using browser-native image decoding.
- Avoid injecting file names into HTML without escaping.
- Use object URLs carefully and revoke them when no longer needed.
- Enforce a max file size and max processing dimensions to avoid memory exhaustion.

## 13. Performance Requirements

| Scenario | Target |
|---|---:|
| Initial preview after upload, 1920 px image | Under 1 second |
| Slider adjustment preview update | Under 100 ms where possible |
| Export at 1920 px | Under 3 seconds |
| Export at 4K | Under 10 seconds where possible |
| UI frame rate while dragging sliders | 30–60 fps |

## 14. Browser Support

### Target Browsers

- Latest stable Chrome.
- Latest stable Edge.
- Latest stable Firefox.
- Latest stable Safari.

### Feature Detection

The app should detect support for:

- WebGL2.
- Canvas 2D.
- OffscreenCanvas.
- Web Workers.
- Clipboard image paste.
- File System Access API, if added later.

If a feature is unavailable, the app should degrade gracefully rather than fail completely.

## 15. Testing Strategy

## 15.1 Unit Tests

Test:

- File validation.
- Filter settings constraints.
- Preset application.
- Export filename generation.
- Local storage persistence.
- Parameter normalisation.

## 15.2 Rendering Tests

Use fixture images and compare output snapshots with a tolerance threshold.

Test fixtures should include:

- High-contrast photo.
- Low-light photo.
- Landscape/street scene.
- Portrait.
- Transparent PNG.
- Very wide background image.
- Very tall image.
- Noisy phone photo.

## 15.3 Browser Tests

Use Playwright or equivalent to test:

- Upload flow.
- Drag-and-drop flow.
- Slider interaction.
- Before/after toggle.
- Export flow.
- Mobile viewport layout.

## 15.4 Performance Tests

Measure:

- Time to first preview.
- Time from slider input to rendered frame.
- Export time by resolution.
- Memory usage for large images.
- Main thread blocking time.

## 16. Acceptance Criteria

The V1 app is complete when:

- User can upload PNG and JPG/JPEG files.
- Unsupported files are rejected cleanly.
- Uploaded image appears in a responsive preview area.
- Cell-shaded effect is visible immediately after upload.
- Bottom parameter panel appears over the lower part of the preview image.
- User can adjust colour levels, edge strength, edge thickness, edge threshold, smoothing, contrast, saturation, shadow bias, and line colour.
- Preview updates in real time as controls change.
- User can switch between at least three built-in presets.
- User can compare original and processed image.
- User can export processed image as PNG.
- App works without a backend.
- App does not upload image data to any server.
- App handles large images without crashing in common cases.
- App provides clear error messages.

## 17. Suggested MVP Build Plan

## Phase 1: Static UI Prototype

- Build app shell.
- Add upload empty state.
- Add preview layout.
- Add floating bottom control panel.
- Add fake sliders and preset selector.

## Phase 2: Image Loading and Canvas Preview

- Implement PNG/JPG validation.
- Decode image.
- Render original image to canvas.
- Add zoom, pan, reset.
- Add metadata display.

## Phase 3: Basic Cell-Shading Filter

- Implement Canvas 2D version first for correctness.
- Add posterisation.
- Add contrast and saturation.
- Add Sobel edge detection.
- Composite outlines over posterised image.

## Phase 4: Real-Time Controls

- Connect sliders to render pipeline.
- Add render scheduling.
- Add preview downscaling.
- Add reset and presets.

## Phase 5: WebGL Acceleration

- Move filter passes to WebGL2 shaders.
- Keep Canvas 2D fallback.
- Add feature detection.
- Benchmark against Canvas 2D implementation.

## Phase 6: Export

- Add PNG export.
- Add JPEG export option.
- Add resolution selector.
- Add full-resolution rendering path.

## Phase 7: Polish and Testing

- Add before/after comparison.
- Add custom presets.
- Add accessibility improvements.
- Add browser tests.
- Add performance tests.
- Add mobile layout.

## 18. Future Enhancements

- Batch process multiple images with the same preset.
- Palette extraction from existing adventure-game screenshots.
- Manual palette import.
- Region masks for applying different strengths to foreground/background.
- Face/sky/foliage-aware tuning.
- Dithered output for retro game styles.
- Pixel-art preview mode.
- Project libraries.
- Plugin system for custom filters.
- Export to game-engine-ready asset folders.
- Integration with itch.io project workflows.

## 19. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Large images cause memory issues | App may crash or hang | Downscale preview, cap dimensions, warn users, full-res export only when feasible. |
| Real-time filtering is too slow in Canvas 2D | Bad user experience | Use WebGL2 as primary renderer, workers where possible, cache intermediate passes. |
| Cell shading looks too generic | Output may not suit point-and-click art | Include strong presets, expose artistic controls, add custom presets. |
| Excessive outlines make images ugly | Poor quality output | Add edge threshold, background preservation, smoothing, and edge strength controls. |
| Browser feature inconsistency | Bugs across Safari/Firefox/Chrome | Use feature detection and fallback paths. |
| Export differs from preview | User frustration | Use same settings and equivalent render pipeline for preview and export; note when preview is downscaled. |

## 20. Open Questions

- Should the app prioritise background images, character portraits, or inventory objects first?
- Should output target a specific game resolution, such as 320×180, 640×360, 1280×720, or 1920×1080?
- Should the visual style lean more comic-book, hand-painted, retro, noir, or LucasArts-style adventure?
- Should images ever be stored locally for returning sessions?
- Should the export include metadata about the preset/settings used?

## 21. Definition of Done for MVP

An MVP is ready when a user can open the site, upload a JPG/PNG photo, adjust a compact bottom control panel, see a convincing cell-shaded result update live, compare it with the original, and export the final PNG for direct use in a game asset pipeline.

