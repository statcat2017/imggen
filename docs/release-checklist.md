# Production Readiness Checklist

Run these steps before deploying a release to production.

## Build

```bash
npm run build
```

Verify:
- [ ] `dist/` directory is produced with no errors
- [ ] `tsc -b` passes with no type errors

## Unit Tests

```bash
npm test
```

Verify:
- [ ] All Vitest tests pass (exit code 0)
- [ ] Rendering snapshot tests pass

## E2E Tests

```bash
npm run test:e2e
```

Verify:
- [ ] All Playwright tests pass on Chromium
- [ ] All Playwright tests pass on Firefox

## Manual Checks

- [ ] **WebGL2 rendering**: Open in Chrome, upload an image, verify cell-shading preview renders. If WebGL fails, verify Canvas2D fallback works.
- [ ] **Canvas2D fallback**: Open in a browser/device without WebGL2 (or disable it in DevTools), verify the app still works.
- [ ] **Export**: Export a PNG and a JPEG, verify files download with correct filenames and content.
- [ ] **Before/after**: Press `B` to cycle through processed/original/split modes.
- [ ] **Drag-and-drop**: Drag an image file onto the drop zone.
- [ ] **Resize**: Resize the browser window; verify layout adapts at mobile widths.

## Browser Compatibility

| Browser   | WebGL2 | Canvas2D Fallback | Export | Before/After |
|-----------|--------|-------------------|--------|--------------|
| Chrome    | ✅     | ✅                | ✅     | ✅           |
| Firefox   | ✅     | ✅                | ✅     | ✅           |
| Safari    | ❓     | ✅                | ❓     | ❓           |
| Edge      | ✅     | ✅                | ✅     | ✅           |

(❓ = not tested; WebGL2 known-working on Safari 16+)

## Known Limitations

- Performance tests are best-effort; exact thresholds depend on hardware and CI environment.
- Snapshot rendering tests use synthetic ImageData fixtures, not real photo files.
- Accessibility coverage is automated (axe-core); manual screen-reader testing not yet performed.
