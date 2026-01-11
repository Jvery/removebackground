# Background Removal Web App - Implementation Plan

> **Last Updated:** 2026-01-11
> **Status:** Phase 0 - Fixing Critical Blockers

---

## Quick Status Summary

| Phase | Name | Status | Progress |
|-------|------|--------|----------|
| 0 | Critical Blockers | COMPLETE | 4/4 |
| 1 | Backend/ML Pipeline | COMPLETE | 3/3 |
| 2 | Image Input | COMPLETE | 3/3 |
| 3 | Processing State | COMPLETE | 3/3 |
| 4 | Preview System | COMPLETE | 3/3 |
| 5 | Export/Download | NOT STARTED | 0/2 |
| 6 | Integration | NOT STARTED | 0/2 |
| 7 | Theme System | NOT STARTED | 0/2 |
| 8 | Polish & QA | NOT STARTED | 0/3 |
| 9 | PWA (Optional) | NOT STARTED | 0/2 |

---

## Dependency Graph

```
Phase 0 (Blockers)
    │
    ▼
Phase 1 (ML) ──────────────────┐
    │                          │
    ▼                          │
Phase 2 (Input) ───┐           │
    │              │           │
    ▼              ▼           ▼
Phase 3 (State) ◄──────────────┘
    │
    ▼
Phase 4 (Preview)
    │
    ▼
Phase 5 (Export)
    │
    ▼
Phase 6 (Integration)
    │
    ├──► Phase 7 (Theme) ──► Phase 8 (Polish)
    │                              │
    └──────────────────────────────┴──► Phase 9 (PWA)
```

---

## Phase 0: Critical Blockers

> **MUST COMPLETE BEFORE ANY DEVELOPMENT**

### 0.1 Missing Dev Dependencies
- [x] Add `@vitejs/plugin-react` to devDependencies
- [x] Add `@testing-library/jest-dom` to devDependencies
- [x] Add `jsdom` to devDependencies
- [x] Run `npm install` to verify

**Fix:** Run the following command:
```bash
npm install -D @vitejs/plugin-react @testing-library/jest-dom jsdom
```

### 0.2 Missing CSS Variables
**File:** `/src/app/globals.css`

- [x] Add `--border` variable (line 31 uses `@apply border-border`)
- [x] Add `--input` variable
- [x] Add `--ring` variable
- [x] Add `--radius` variable
- [x] Add `--card` and `--card-foreground` variables
- [x] Add `--popover` and `--popover-foreground` variables
- [x] Add `--secondary` and `--secondary-foreground` variables
- [x] Add `--destructive` and `--destructive-foreground` variables

**Fix:** Add to `:root` in globals.css:
```css
:root {
  /* Existing vars... */

  /* Missing vars to add: */
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;
  --radius: 0.5rem;

  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;

  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;

  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;

  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
}

.dark {
  /* Add dark mode equivalents */
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 212.7 26.8% 83.9%;

  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;

  --popover: 222.2 84% 4.9%;
  --popover-foreground: 210 40% 98%;

  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;

  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;
}
```

### 0.3 Missing Tailwind Mappings
**File:** `/tailwind.config.ts`

- [x] Add `border` color mapping
- [x] Add `input` color mapping
- [x] Add `ring` color mapping
- [x] Add `card` with `DEFAULT` and `foreground`
- [x] Add `popover` with `DEFAULT` and `foreground`
- [x] Add `secondary` with `DEFAULT` and `foreground`
- [x] Add `destructive` with `DEFAULT` and `foreground`

**Fix:** Update `theme.extend.colors` in tailwind.config.ts:
```typescript
colors: {
  // Existing...
  border: "hsl(var(--border))",
  input: "hsl(var(--input))",
  ring: "hsl(var(--ring))",
  card: {
    DEFAULT: "hsl(var(--card))",
    foreground: "hsl(var(--card-foreground))",
  },
  popover: {
    DEFAULT: "hsl(var(--popover))",
    foreground: "hsl(var(--popover-foreground))",
  },
  secondary: {
    DEFAULT: "hsl(var(--secondary))",
    foreground: "hsl(var(--secondary-foreground))",
  },
  destructive: {
    DEFAULT: "hsl(var(--destructive))",
    foreground: "hsl(var(--destructive-foreground))",
  },
},
borderRadius: {
  lg: "var(--radius)",
  md: "calc(var(--radius) - 2px)",
  sm: "calc(var(--radius) - 4px)",
},
```

### 0.4 Create Components Directory
- [x] Create `/src/components/` directory

**Fix:**
```bash
mkdir -p /home/dimkha/Documents/GitHub/removebackground/src/components
```

**Additional fixes applied:**
- Created `.eslintrc.json` with Next.js core-web-vitals config
- Renamed `vitest.config.ts` to `vitest.config.mts` for ESM compatibility
- Added e2e exclusion pattern to vitest config

---

## Phase 1: Backend/ML Pipeline

> **Spec Reference:** `specs/background-removal.md`

### 1.1 Backend Detection
**File:** `/src/lib/backend-detection.ts`

- [x] Implement WebGPU availability check
- [x] Implement WebGL fallback detection
- [x] Implement CPU-only fallback
- [x] Export `detectBestBackend()` function
- [x] Add unit tests

**Priority Order:** WebGPU > WebGL > CPU

### 1.2 Model Cache
**File:** `/src/lib/model-cache.ts`

- [x] Implement IndexedDB storage for model (~40MB)
- [x] Add cache validation (version check)
- [x] Add cache clear functionality
- [x] Export `getModelFromCache()`, `saveModelToCache()`, `clearModelCache()`
- [x] Add unit tests

### 1.3 Background Removal Core
**File:** `/src/lib/background-removal.ts`

- [x] Initialize `@xenova/transformers` pipeline
- [x] Load `briaai/RMBG-1.4` model
- [x] Implement `removeBackground(imageData)` function
- [x] Add progress callback support
- [x] Handle model loading states
- [x] Add unit tests with mock images

---

## Phase 2: Image Input System

> **Spec Reference:** `specs/image-upload.md`

### 2.1 Image Validation
**File:** `/src/lib/image-validation.ts`

- [x] Implement magic byte validation (PNG, JPEG, WebP, GIF)
- [x] Add dimension checks (max 4096x4096 recommended)
- [x] Add file size validation
- [x] Export `validateImage()`, `getImageDimensions()`
- [x] Add unit tests

**Magic Bytes:**
- PNG: `89 50 4E 47`
- JPEG: `FF D8 FF`
- WebP: `52 49 46 46` ... `57 45 42 50`
- GIF: `47 49 46 38`

### 2.2 Image Input Hook
**File:** `/src/lib/use-image-input.ts`

- [x] Handle drag & drop events
- [x] Handle clipboard paste (Ctrl+V)
- [x] Handle file picker selection
- [x] Integrate with validation
- [x] Return `{ image, error, isLoading, handleDrop, handlePaste, handleSelect }`
- [x] Add unit tests

### 2.3 Drop Zone Component
**File:** `/src/components/drop-zone.tsx`

- [x] Create visual drop target
- [x] Add drag-over state styling
- [x] Add click-to-browse functionality
- [x] Show validation errors
- [x] Add loading state
- [x] Responsive design
- [x] Add component tests

---

## Phase 3: Processing State Management

### 3.1 Processing Hook
**File:** `/src/lib/use-processing.ts`

- [x] Implement state machine: `idle` -> `loading` -> `processing` -> `complete` | `error`
- [x] Track progress percentage
- [x] Handle cancellation
- [x] Store original and processed images
- [x] Export `useProcessing()` hook
- [x] Add unit tests

**States:**
```typescript
type ProcessingState =
  | { status: 'idle' }
  | { status: 'loading'; progress: number }
  | { status: 'processing'; progress: number }
  | { status: 'complete'; original: ImageData; processed: ImageData }
  | { status: 'error'; error: Error };
```

### 3.2 Progress Indicator
**File:** `/src/components/progress-indicator.tsx`

- [x] Show loading bar during model load
- [x] Show processing progress
- [x] Add cancel button
- [x] Animate transitions
- [x] Add component tests

### 3.3 Error Boundary
**File:** `/src/components/error-boundary.tsx`

- [x] Catch rendering errors
- [x] Catch async errors
- [x] Show user-friendly error messages
- [x] Add retry functionality
- [x] Log errors for debugging
- [x] Add component tests

---

## Phase 4: Preview System

> **Spec Reference:** `specs/image-preview.md`

### 4.1 Zoomable Image
**File:** `/src/components/zoomable-image.tsx`

- [x] Implement zoom controls (0.5x to 4x)
- [x] Add scroll wheel zoom
- [x] Implement pan with mouse drag
- [x] Add pinch-to-zoom for touch
- [x] Reset view button
- [x] Add component tests

### 4.2 Comparison Slider
**File:** `/src/components/comparison-slider.tsx`

- [x] Overlay original and processed images
- [x] Draggable divider line
- [x] Touch support
- [x] Keyboard accessibility
- [x] Add component tests

### 4.3 Image Preview Container
**File:** `/src/components/image-preview.tsx`

- [x] View mode toggle: Side-by-side | Slider | Processed only
- [x] Integrate ZoomableImage
- [x] Integrate ComparisonSlider
- [x] Checkerboard transparency background
- [x] Add component tests

---

## Phase 5: Export & Download

> **Spec Reference:** `specs/download-export.md`

### 5.1 Export Utilities
**File:** `/src/lib/export.ts`

- [ ] Export to PNG (lossless)
- [ ] Export to WebP (with quality option)
- [ ] Copy to clipboard functionality
- [ ] Generate download filename with timestamp
- [ ] Add unit tests

### 5.2 Download Button
**File:** `/src/components/download-button.tsx`

- [ ] Format selector (PNG/WebP)
- [ ] Quality slider for WebP
- [ ] Copy to clipboard button
- [ ] Download trigger
- [ ] Add component tests

---

## Phase 6: Integration

### 6.1 Convert Page to Client Component
**File:** `/src/app/page.tsx`

- [ ] Add `'use client'` directive
- [ ] Remove placeholder comment
- [ ] Import all components
- [ ] Wire up state management

### 6.2 Full Integration
**File:** `/src/app/page.tsx`

- [ ] Connect DropZone -> useImageInput -> useProcessing
- [ ] Connect useProcessing -> ImagePreview
- [ ] Connect ImagePreview -> DownloadButton
- [ ] Add ErrorBoundary wrapper
- [ ] Integration tests
- [ ] E2E tests with Playwright

---

## Phase 7: Theme System

> **Spec Reference:** `specs/ui-design.md`

### 7.1 Theme Provider
**File:** `/src/components/theme-provider.tsx`

- [ ] Detect system preference (`prefers-color-scheme`)
- [ ] Persist user preference to localStorage
- [ ] Provide theme context
- [ ] Handle SSR hydration
- [ ] Add unit tests

### 7.2 Theme Toggle
**File:** `/src/components/theme-toggle.tsx`

- [ ] Sun/Moon icon toggle
- [ ] Smooth transition animation
- [ ] Keyboard accessible
- [ ] Add component tests

### 7.3 Integrate Theme
- [ ] Wrap app in ThemeProvider (`/src/app/layout.tsx`)
- [ ] Add ThemeToggle to header
- [ ] Verify dark mode styles throughout

---

## Phase 8: Polish & QA

### 8.1 Apply Frontend Design Skill
- [ ] Run `/frontend-design` skill for distinctive UI
- [ ] Avoid generic AI aesthetics
- [ ] Ensure production-grade quality
- [ ] Review and iterate on design

### 8.2 Accessibility Audit
- [ ] Run accessibility audit (`mcp__browser-tools__runAccessibilityAudit`)
- [ ] Achieve WCAG AA compliance
- [ ] Test with keyboard navigation
- [ ] Test with screen reader
- [ ] Add proper ARIA labels
- [ ] Ensure color contrast ratios

### 8.3 Performance Optimization
- [ ] Run performance audit (`mcp__browser-tools__runPerformanceAudit`)
- [ ] Optimize bundle size
- [ ] Lazy load heavy components
- [ ] Add loading skeletons
- [ ] Optimize image handling
- [ ] Test on slow connections

---

## Phase 9: PWA (Optional)

### 9.1 Service Worker
**File:** `/public/sw.js` or via next-pwa

- [ ] Cache static assets
- [ ] Cache model files
- [ ] Offline support
- [ ] Background sync

### 9.2 Web App Manifest
**File:** `/public/manifest.json`

- [ ] App name and icons
- [ ] Theme colors
- [ ] Display mode (standalone)
- [ ] Start URL

---

## Existing Files Reference

| File | Status | Notes |
|------|--------|-------|
| `/src/app/layout.tsx` | COMPLETE | Proper metadata, no changes needed |
| `/src/app/page.tsx` | PLACEHOLDER | Contains only placeholder comment |
| `/src/app/globals.css` | COMPLETE | CSS variables added (Phase 0) |
| `/src/lib/test-setup.ts` | COMPLETE | Just imports jest-dom |
| `/e2e/home.spec.ts` | MINIMAL | 2 basic tests, expand in Phase 6 |
| `/package.json` | COMPLETE | Dev dependencies added (Phase 0) |
| `/tailwind.config.ts` | COMPLETE | Color mappings added (Phase 0) |
| `/vitest.config.ts` | COMPLETE | Fixed for ESM compatibility (Phase 0) |
| `/playwright.config.ts` | COMPLETE | No changes needed |
| `/src/lib/backend-detection.ts` | COMPLETE | WebGPU/WebGL/CPU detection |
| `/src/lib/model-cache.ts` | COMPLETE | IndexedDB model caching |
| `/src/lib/background-removal.ts` | COMPLETE | ML pipeline with @xenova/transformers |
| `/src/lib/image-validation.ts` | COMPLETE | Magic bytes validation, dimension checks |
| `/src/lib/use-image-input.ts` | COMPLETE | React hook for image input handling |
| `/src/components/drop-zone.tsx` | COMPLETE | Visual drop zone component |
| `/src/lib/use-processing.ts` | COMPLETE | Processing state machine hook |
| `/src/components/progress-indicator.tsx` | COMPLETE | Visual progress feedback |
| `/src/components/error-boundary.tsx` | COMPLETE | Error catching and recovery |
| `/src/components/zoomable-image.tsx` | COMPLETE | Zoom/pan image viewer |
| `/src/components/comparison-slider.tsx` | COMPLETE | Before/after slider comparison |
| `/src/components/image-preview.tsx` | COMPLETE | Preview container with view modes |

---

## Files to Create Summary

| Phase | File Path | Priority | Status |
|-------|-----------|----------|--------|
| 2 | `/src/lib/image-validation.ts` | HIGH | COMPLETE |
| 2 | `/src/lib/use-image-input.ts` | HIGH | COMPLETE |
| 2 | `/src/components/drop-zone.tsx` | HIGH | COMPLETE |
| 3 | `/src/lib/use-processing.ts` | HIGH | COMPLETE |
| 3 | `/src/components/progress-indicator.tsx` | HIGH | COMPLETE |
| 3 | `/src/components/error-boundary.tsx` | HIGH | COMPLETE |
| 4 | `/src/components/zoomable-image.tsx` | HIGH | PENDING |
| 4 | `/src/components/comparison-slider.tsx` | HIGH | PENDING |
| 4 | `/src/components/image-preview.tsx` | HIGH | PENDING |
| 5 | `/src/lib/export.ts` | HIGH | PENDING |
| 5 | `/src/components/download-button.tsx` | HIGH | PENDING |
| 7 | `/src/components/theme-provider.tsx` | MEDIUM | PENDING |
| 7 | `/src/components/theme-toggle.tsx` | MEDIUM | PENDING |
| 9 | `/public/sw.js` | LOW | PENDING |
| 9 | `/public/manifest.json` | LOW | PENDING |

---

## Verification Checklist

After completing each phase, verify:

- [ ] `npm run build` succeeds
- [ ] `npm run test` passes
- [ ] `npm run lint` has no errors
- [ ] `npm run e2e` passes (where applicable)
- [ ] Manual testing in browser works
- [ ] No console errors

---

## Specs Reference

All specifications are located in `/home/dimkha/Documents/GitHub/removebackground/specs/`:

| Spec File | Phases | Description |
|-----------|--------|-------------|
| `background-removal.md` | 1 | ML engine, model caching, backend detection |
| `image-upload.md` | 2 | Drop zone, validation, input methods |
| `image-preview.md` | 4 | Comparison views, zoom/pan, accessibility |
| `download-export.md` | 5 | Format options, clipboard, memory cleanup |
| `ui-design.md` | 7, 8 | Theme, responsive design, accessibility |

---

## Notes

- All processing happens client-side (no server uploads)
- Model size is ~40MB, must be cached in IndexedDB
- Target browsers: Chrome 90+, Firefox 90+, Safari 15+, Edge 90+
- Mobile support is secondary but required
