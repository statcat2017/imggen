# Project Health Check — 2026-05-25

Three reviews were run on the current state of `sprint-5-webgl` (base `ff9c116`, head `794b813`):

- Clean-code review (small functions, naming, duplication, error handling)
- Architecture review (module depth, seams, locality, leverage)
- PR-style code review (correctness, WebGL resource/error handling, fallback, testing)

---

## Critical

### 1. `uDilatePasses` integer uniform uses `uniform1f` instead of `uniform1i`

`composite.frag` declares `uniform int uDilatePasses`, but `WebGLRenderer.runPass()` sends all numeric uniforms as `gl.uniform1f`. WebGL requires `gl.uniform1i` for `int` uniforms. The value never reaches the shader — edge thickness in WebGL is silently broken.

### 2. `gl.createBuffer()` non-null assertions hide allocation failure

VAO creation is checked and throws on null. The position and texcoord buffers use `gl.createBuffer()!`, which suppresses the null but crashes at runtime if allocation fails.

### 3. `globalRenderId` is module-scoped

Multiple `RenderController` instances share a single counter. If two controllers exist (e.g., during testing or a future split-preview feature), one can cross-cancel the other's renders.

### 4. Partial resource leaks on FBO/texture creation failure

If `createFBO` fails after `createTexture2D`, the texture is leaked. If framebuffer completeness check fails after binding, the FBO is leaked.

---

## Important

### 5. WebGL vs Canvas 2D border handling differs

CPU smooth skips out-of-bounds samples and divides by actual count. WebGL samples 3x3 clamped-to-edge and always divides by 9. CPU edgeDetect skips border pixels; WebGL clamps. Results differ at image borders.

### 6. No test coverage for high-risk behaviour

- Renderer factory fallback (WebGL unavailable)
- `RenderController` fallback (WebGL runtime failure)
- Canvas2D pass cache key derivation and invalidation
- Filter store persistence round-trip and preset matching
- CPU/WebGL output parity
- Dynamic filter validation

### 7. `linkProgram` leaks shaders when `createProgram` fails

Both `vs` and `fs` (compiled) are leaked if `gl.createProgram()` returns null.

### 8. `FilterControlsPanel` is large, repetitive, contains dead/no-op UI

The component hard-codes every slider, toggle, and preset lookup. Export format/resolution state lives here but the export button is `onClick={() => {}}`.

### 9. Store persistence is tightly coupled and under-validated

`filterStore` directly reads/writes `localStorage`, silently ignores failures, merges parsed JSON without shape validation, and duplicates `saveSettings` in three places.

### 10. `.js` files exist alongside `.ts` files in `src/`

39 `.js` files (e.g. `src/store/filterStore.js`, `src/rendering/Canvas2DRenderer.js`) sit beside the `.ts` originals. These appear to be stale compiled outputs.

---

## Minor

### 11. Shader border handling documented but unresolved

The known pixel differences at image borders between CPU and GPU paths should be explicitly called out rather than letting the "no behaviour change" claim erode trust.

### 12. `edgeTarget` selection logic is unnecessarily complex

```ts
const edgeTarget = this.fboA === this.fboC ? this.fboB! : this.fboA!;
```

`fboA` and `fboC` are always separate, so this always resolves to `fboA`. Simplify.

### 13. `createPreviewRenderer` creates a throwaway WebGL context

The factory creates a test context just for feature detection, then `WebGLRenderer` creates another. Use a try-catch on `new WebGLRenderer()` instead.

### 14. No CONTEXT.md or ADR directory exists

Domain glossary and architectural decisions are not recorded outside SPRINTS.md and the new filter-architecture.md.

---

## Recommended Fix Priority

### Fix now (before merge)

| # | Issue | Effort | Risk if deferred |
|---|-------|--------|------------------|
| 1 | `uDilatePasses` integer uniform | 15 min | WebGL edge thickness broken for all users |
| 2 | `gl.createBuffer()` null checks | 5 min | Crash on context-loss edge case |
| 3 | `globalRenderId` → instance field | 5 min | Cross-cancellation bug in future split-preview |
| 4 | Partial FBO/texture cleanup | 10 min | Resource leak on init failure |
| 7 | `linkProgram` shader leak | 5 min | Resource leak on init failure |

### Fix this week

| # | Issue | Effort |
|---|-------|--------|
| 5 | Document border differences | 15 min |
| 8 | Extract control metadata, wire export | 2–3h |
| 9 | Isolate persistence, add validation | 2–3h |
| 12 | Simplify `edgeTarget` | 5 min |
| 13 | Simplify `createPreviewRenderer` | 10 min |

### Fix before filter-architecture phases

| # | Issue | When |
|---|-------|------|
| 6 | Add tests | Before adding 2nd filter |
| 10 | Clean up `.js` files | Before CI setup |
| 14 | Add CONTEXT.md / ADRs | Before team onboarding |
