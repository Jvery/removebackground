## Build & Run

Next.js 14+ with App Router. All processing client-side.

```bash
npm install
npm run dev        # Development server on localhost:3000
npm run build      # Production build
npm run start      # Start production server
```

## Validation

Run these after implementing to get immediate feedback:

- Tests: `npm test`
- Typecheck: `npm run typecheck` (or `npx tsc --noEmit`)
- Lint: `npm run lint`
- E2E: `npx playwright test` (first run: `npx playwright install`)
  - Webkit tests require system deps: `sudo npx playwright install-deps`
  - Skip webkit with: `npx playwright test --project=chromium --project=firefox`

## Frontend Validation

- Visual check: `npm run dev` and inspect in browser
- Lighthouse: `npx lighthouse http://localhost:3000 --view`
- Bundle analysis: `npm run build && npx @next/bundle-analyzer`

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **ML Runtime**: @xenova/transformers (Transformers.js)
- **Model**: briaai/RMBG-1.4 (or equivalent ONNX model)
- **Testing**: Vitest + Playwright

## Key Patterns

### ML Model Loading

```typescript
// Lazy load model on first use
const removeBackground = lazy(() => import('@/lib/background-removal'));
```

### Client-Only Components

```typescript
// Use 'use client' directive for browser-only code
'use client';
```

### Image Processing

- Use OffscreenCanvas when available
- Fall back to regular Canvas
- Always revoke object URLs after use

## Environment

No environment variables required — fully client-side.

## Codebase Patterns

- Components in `src/components/`
- Library code in `src/lib/`
- App routes in `src/app/`
- Use `@/` path alias for imports
