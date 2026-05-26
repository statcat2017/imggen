# Filter Architecture — Extending imggen With Definition-Driven Filters

## Motivation

The current app hard-codes one pipeline (cell shading) into the renderers, the store types, and the UI. Adding a new filter like "Muted Architectural Noir" currently requires editing:
- `FilterSettings` type
- `FilterControlsPanel` component (hard-coded sliders)
- `Canvas2DRenderer` (hard-coded pipeline order)
- `WebGLRenderer` (hard-coded pass order)
- `filterStore` (hard-coded preset matching)

This document describes the end state and the incremental phases to get there.

## Target Architecture

```
src/filters/
  types.ts               — FilterDefinition, FilterStage, FilterPreset, FilterControlDefinition
  registry.ts             — filterRegistry array
  cellShading/
    definition.ts         — CellShadingFilter definition + controls
    presets.ts            — Adventure Background, Comic Ink, etc.
  mutedArchitecturalNoir/
    definition.ts
    presets.ts

src/rendering/stages/
  cpu/
    smooth.ts
    colorCorrect.ts
    posterize.ts
    edgeDetect.ts
    composite.ts
    posterizeLuminance.ts   ← new
    atmosphericHaze.ts       ← new
    ...
  webgl/
    shaders/
    WebGLStageRunner.ts

src/store/
  filterStore.ts           — refactored: activeFilterId + settingsByFilter
```

A `FilterDefinition` describes everything the app needs:

```text
filter.controls  →  UI renders sliders/toggles
filter.defaults  →  initial state
filter.presets   →  dropdown options
filter.cpuPipeline  →  Canvas2D executes this
filter.webglPipeline →  WebGL executes this
```

Renderers stop knowing about "cell shading" specifically. They receive a `filter` and execute its pipeline.

## Core Types

```ts
// src/filters/types.ts

export type FilterControlKind = "slider" | "toggle" | "select" | "color";

export type FilterControlDefinition = {
  key: string;
  label: string;
  kind: FilterControlKind;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string; label: string }[];
};

export type FilterStage<TSettings> = {
  id: string;
  /** Settings keys this stage reads — used for automatic cache key derivation. */
  dependsOn: (keyof TSettings)[];
  runCpu: (input: ImageData, settings: TSettings) => ImageData;
  runWebgl?: (gl: WebGL2RenderingContext, uniforms: Record<string, unknown>, settings: TSettings) => void;
};

export type FilterPreset<TSettings> = {
  id: string;
  name: string;
  description: string;
  settings: TSettings;
};

export type FilterDefinition<TSettings> = {
  id: string;
  name: string;
  description: string;
  controls: FilterControlDefinition[];
  defaults: TSettings;
  presets: FilterPreset<TSettings>[];
  cpuPipeline: FilterStage<TSettings>[];
  webglPipeline?: FilterStage<TSettings>[];
};

// Registry entry wraps typed definition for storage in a single array.
export type FilterRegistryEntry = {
  id: string;
  name: string;
  description: string;
  controls: FilterControlDefinition[];
  defaults: Record<string, unknown>;
  presets: { id: string; name: string; description: string; settings: Record<string, unknown> }[];
  cpuPipeline: { id: string; dependsOn: string[] }[];
  webglPipeline?: { id: string; dependsOn: string[] }[];
};
```

## Refactor Phases

### Phase 1: Extract Cell-Shading Filter

**What changes:**

Create filter definition:

```text
src/filters/cellShading/definition.ts
  → CellShadingFilter: FilterDefinition<CellShadingSettings>
  → controls match current slider/toggle/color set
  → defaults = defaultFilterSettings
  → presets = builtInPresets mapped to FilterPreset shape

src/filters/cellShading/presets.ts
  → extracted from current builtInPresets.ts

src/filters/registry.ts
  → [cellShadingFilter]
```

No behaviour change. Existing store/types still reference `CellShadingSettings` directly.

**Keep identical:**

```text
FilterControlsPanel       — unchanged (still hard-coded)
useRenderController        — unchanged
RenderController.renderPreview — unchanged
Canvas2DRenderer.render()   — unchanged
```

**Duration:** ~1 hour. Pure extraction, no logic changes.

---

### Phase 2: Make Renderer Accept a FilterDefinition

**What changes:**

`RenderRequest` gains a `filter` field:

```ts
type RenderRequest = {
  source: ImageBitmap;
  sourceId: string;
  filter: FilterRegistryEntry;
  settings: Record<string, unknown>;
};
```

`Canvas2DRenderer.render()` changes from hard-coded pipeline to iterating over `request.filter.cpuPipeline`:

```ts
for (const stage of filter.cpuPipeline) {
  const stageImpl = cpuStageRegistry.get(stage.id);
  imageData = stageImpl.runCpu(imageData, request.settings);
}
```

`cpuStageRegistry` is a map of stage id → implementation. Existing stages (`smooth`, `colorCorrect`, etc.) are registered but not relocated yet.

**Why this matters:**

This is the seam that makes the architecture extensible. Adding a second filter no longer requires editing renderer code.

**Duration:** ~2–3 hours.

---

### Phase 3: Derive Pass Cache Keys From Stage Metadata

**What changes:**

Each stage declares `dependsOn` — which settings keys affect its output.

```ts
{
  id: "smooth",
  dependsOn: ["smoothing"],
  ...
}
```

The renderer generates cache keys automatically:

```ts
function cacheKey(stage, sourceId, settings) {
  const subset = stage.dependsOn.map(k => `${k}=${settings[k]}`);
  return `${sourceId}/${stage.id}/${subset.join("&")}`;
}
```

This replaces the three hand-written hash functions (`hashSmoothed`, `hashPosterized`, `hashEdgeMask`).

New filters get caching automatically without writing cache logic.

**Duration:** ~3–4 hours.

---

### Phase 4: Generate Controls From FilterDefinition

**What changes:**

`FilterControlsPanel` stops hard-coding JSX for each control.

Instead:

```tsx
const filter = useFilterRegistry(f => f.activeFilter);
const settings = useFilterStore(s => s.settings);

filter.controls.map(control => {
  switch (control.kind) {
    case "slider":
      return <Slider key={control.key} value={settings[control.key]} ... />;
    case "toggle":
      return <Toggle key={control.key} ... />;
    // ...
  }
});
```

Section layout (Look, Lines, Cleanup, Export) can be derived from control groups or kept as a separate metadata field on the filter definition (add `group?: string` to `FilterControlDefinition`).

**Duration:** ~3–4 hours.

---

### Phase 5: Refactor Store

**What changes:**

`filterStore` moves from a single `settings: CellShadingSettings` to:

```ts
type FilterStore = {
  activeFilterId: string;
  settingsByFilter: Record<string, Record<string, unknown>>;
  basePresetIdByFilter: Record<string, string | null>;
};
```

When the user switches filters, the store preserves each filter's settings so switching back restores the previous state.

Persistence needs a key change: `"imggen-filter-settings"` stores a map keyed by filter id.

**Duration:** ~2–3 hours.

---

### Phase 6: Add Muted Architectural Noir (CPU-First)

**What changes:**

New filter definition:

```text
src/filters/mutedArchitecturalNoir/definition.ts
src/filters/mutedArchitecturalNoir/presets.ts
```

New CPU stages (implemented in `src/rendering/stages/cpu/`):

```text
posterizeLuminance.ts
  — posterise luminance channel, recombine with chroma
mutedPaletteGrade.ts
  — three-band luminance->tint mapping
toneCompress.ts
  — gamma + shadow lift + highlight roll-off
silhouetteEnhance.ts
  — darken low-luminance connected regions
atmosphericHaze.ts
  — blend haze colour by depth proxy
matteFinish.ts
  — subtle blur + grain + vignette
```

**Existing reused stages:**

```text
smooth.ts (already exists; edge-aware variant may be needed)
colorCorrect.ts (desaturation + contrast already exist)
edgeDetect.ts (Sobel already exists)
composite.ts (edge blend already exists)
```

Register the new filter in `registry.ts`.

**Duration:** ~2–3 days (stage implementation).

---

### Phase 7: Add WebGL Equivalents

**What changes:**

Add `runWebgl` implementations to new stages.

Pass structure depends on the stage:

```text
posterizeLuminance → single-pass shader
mutedPaletteGrade → single-pass shader
toneCompress → single-pass shader
silhouetteEnhance → might stay CPU-only (heuristic approach)
atmosphericHaze → single-pass shader
matteFinish → multi-pass shader (blur + grain)
```

`WebGLRenderer` iterates over `filter.webglPipeline` similarly to how `Canvas2DRenderer` iterates over `cpuPipeline`.

**Duration:** ~2–3 days.

---

### Phase 8: LLM Filter Ingestion

**What changes:**

Add a command/hook/routes that takes an LLM-generated spec and converts it to a `FilterRegistryEntry`.

**Validation rules:**

```text
- Only allowlisted stage IDs are accepted
- Only allowlisted control kinds are accepted
- Numeric ranges have min/max required
- No arbitrary JS or GLSL strings pass through
- No runtime code evaluation (no eval, no new Function)
```

**Output:**

The LLM produces JSON like:

```json
{
  "id": "muted-architectural-noir",
  "name": "Muted Architectural Noir",
  "description": "...",
  "controls": [
    { "key": "moodDarkness", "label": "Mood Darkness", "kind": "slider", "min": 0, "max": 1, "step": 0.01 },
    ...
  ],
  "defaults": { "moodDarkness": 0.58, ... },
  "pipeline": [
    { "stage": "smooth", "params": { "strength": 0.72 } },
    { "stage": "mutedPaletteGrade", "params": {} },
    ...
  ]
}
```

The app validates against the stage allowlist, then registers the filter.

**Duration:** ~1 day (validation + UI).

---

### Phase 9 (Optional): LLM Prompt Template

Create a documented prompt template that developers can give to an LLM to produce a spec that maps cleanly onto the app's stage library.

Included in:

```text
docs/llm-filter-prompt.md
```

This step isn't code — it's documentation of the ingestion flow.

---

## Summary

| Phase | What | Why | Est. |
|-------|------|-----|------|
| 1 | Extract cell-shading filter definition | Foundation, no behaviour change | 1h |
| 2 | Make renderer accept filter definition | Core extensibility seam | 2–3h |
| 3 | Derive cache keys from stage metadata | New filters get caching free | 3–4h |
| 4 | Generate controls UI from filter definition | New filters get controls free | 3–4h |
| 5 | Refactor store for multi-filter | Switch filters without losing state | 2–3h |
| 6 | Implement Muted Architectural Noir (CPU) | First proof of new architecture | 2–3d |
| 7 | Add WebGL stages | GPU acceleration for new filter | 2–3d |
| 8 | LLM filter ingestion | Import specs without writing code | 1d |
| 9 | LLM prompt template | Document ingestion flow | — |

**Total:** ~2–3 weeks for a thorough implementation. Phase 1 alone is a valuable incremental improvement (extraction without breaking anything).

## Key Tradeoffs

| Choice | Why |
|--------|-----|
| First-party filters stay typed | TypeScript safety for the core experience |
| Dynamic filters use schema-validated `Record<string, unknown>` | Safe without requiring TS compilation at import time |
| Stage allowlist, not arbitrary code | Prevents security and correctness issues |
| Cache keys derived from `dependsOn` | One less thing to get wrong per filter |
| CPU-first for each new filter | GLSL correctness is harder; CPU reference catches bugs |
