# Background Removal Engine

## Overview

The core ML-powered background removal system that runs entirely in the browser using WebGPU/WebGL acceleration. No server-side processing — all computation happens on the client.

## Technical Approach

Use `@xenova/transformers` library with the `briaai/RMBG-1.4` model (or equivalent) that runs in the browser via ONNX Runtime Web or Transformers.js.

### Model Loading Strategy

- Lazy load the model on first use (not on page load)
- Show loading progress during model download (~40MB compressed)
- Cache model in IndexedDB for subsequent visits
- Provide fallback messaging if WebGPU/WebGL unavailable

### Processing Pipeline

1. Accept image input (File, Blob, or URL)
2. Resize image to model's expected input size (1024x1024 typical)
3. Run inference through the segmentation model
4. Generate alpha mask from model output
5. Apply mask to original image (preserve original resolution)
6. Return processed image with transparent background

## Acceptance Criteria

- [ ] Model loads successfully in Chrome, Firefox, Safari, Edge
- [ ] Processing time < 5 seconds for images up to 4MP on modern hardware
- [ ] Memory usage stays under 2GB during processing
- [ ] Produces clean alpha edges (no harsh cutoffs)
- [ ] Handles edge cases: hair, transparent objects, complex backgrounds
- [ ] Works offline after initial model cache
- [ ] Provides real-time progress updates during processing

## Error Handling

- Graceful degradation if WebGPU unavailable (fall back to WebGL, then CPU)
- Clear error messages for unsupported browsers
- Recovery from out-of-memory errors
- Timeout handling for stuck inference

## API Surface

```typescript
interface RemovalOptions {
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
}

interface RemovalResult {
  blob: Blob;
  width: number;
  height: number;
  processingTimeMs: number;
}

function removeBackground(
  input: File | Blob | string,
  options?: RemovalOptions
): Promise<RemovalResult>;

function preloadModel(): Promise<void>;
function isModelCached(): Promise<boolean>;
function clearModelCache(): Promise<void>;
```
