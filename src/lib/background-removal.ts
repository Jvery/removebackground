/**
 * Background Removal Core Module
 *
 * Uses @xenova/transformers with briaai/RMBG-1.4 model for client-side
 * background removal. All processing happens in the browser - no server uploads.
 *
 * Uses AutoModel and AutoProcessor because RMBG-1.4 requires custom model_type
 * configuration that the pipeline API doesn't support.
 */

import { detectBestBackend, type Backend } from './backend-detection'

// Model configuration
const MODEL_ID = 'briaai/RMBG-1.4'

// Model and processor state
let model: unknown | null = null
let processor: unknown | null = null
let modelPromise: Promise<void> | null = null
let currentBackend: Backend | null = null

export interface RemovalOptions {
  onProgress?: (progress: number) => void
  signal?: AbortSignal
  /**
   * Threshold for binarizing the mask (0-1).
   * Values above this threshold become fully opaque (255).
   * Values below become fully transparent (0).
   * Default is 0.5. Use higher values for tighter foreground selection,
   * lower values to include more of the subject.
   */
  threshold?: number
}

export interface RemovalResult {
  blob: Blob
  width: number
  height: number
  processingTimeMs: number
}

// Type for RawImage from transformers.js
interface RawImageType {
  width: number
  height: number
  resize: (width: number, height: number) => Promise<RawImageType>
  toCanvas: () => HTMLCanvasElement
}

// Type for Tensor from transformers.js
interface TensorType {
  data: Float32Array | Uint8Array
  dims: number[]
  sigmoid: () => TensorType
  squeeze: (dim?: number) => TensorType
  mul: (value: number) => TensorType
  to: (dtype: string) => TensorType
  toCanvas: () => HTMLCanvasElement
  [index: number]: TensorType // Allow indexing
}

/**
 * Initialize the model and processor
 * Lazy loads @xenova/transformers to avoid blocking initial page load
 */
async function initializeModel(
  onProgress?: (progress: number) => void
): Promise<void> {
  // Return if already initialized
  if (model && processor) {
    return
  }

  // Return existing promise if initialization is in progress
  if (modelPromise) {
    return modelPromise
  }

  modelPromise = (async () => {
    // Detect best backend
    currentBackend = await detectBestBackend()

    // Dynamic import to avoid bundling transformers.js with initial page load
    const { AutoModel, AutoProcessor, env } = await import('@xenova/transformers')

    // Configure environment to always use remote models from Hugging Face Hub
    env.allowLocalModels = false
    env.useBrowserCache = true

    // Configure environment based on detected backend
    if (currentBackend === 'webgpu') {
      env.backends.onnx.wasm.proxy = false
    }

    // Report progress for model loading
    onProgress?.(0.1)

    // Load model with custom configuration for RMBG-1.4
    const modelInstance = await AutoModel.from_pretrained(MODEL_ID, {
      config: { model_type: 'custom' },
      progress_callback: (progress: { progress?: number; status?: string }) => {
        if (progress.progress !== undefined) {
          // Scale progress: model loading is 10-50% of total progress
          const scaledProgress = 0.1 + (progress.progress / 100) * 0.4
          onProgress?.(scaledProgress)
        }
      },
    })

    onProgress?.(0.5)

    // Load processor with custom configuration for RMBG-1.4
    const processorInstance = await AutoProcessor.from_pretrained(MODEL_ID, {
      config: {
        do_normalize: true,
        do_pad: false,
        do_rescale: true,
        do_resize: true,
        image_mean: [0.5, 0.5, 0.5],
        feature_extractor_type: 'ImageFeatureExtractor',
        image_std: [1, 1, 1],
        resample: 2,
        rescale_factor: 0.00392156862745098,
        size: { width: 1024, height: 1024 },
      },
    })

    onProgress?.(0.7)

    model = modelInstance
    processor = processorInstance
  })()

  return modelPromise
}

/**
 * Remove background from an image
 */
export async function removeBackground(
  input: File | Blob | string,
  options?: RemovalOptions
): Promise<RemovalResult> {
  const startTime = performance.now()
  const { onProgress, signal, threshold = 0.5 } = options || {}

  // Check for abort before starting
  if (signal?.aborted) {
    throw new Error('Operation aborted')
  }

  // Initialize model (lazy load)
  await initializeModel(onProgress)

  // Check for abort after model loading
  if (signal?.aborted) {
    throw new Error('Operation aborted')
  }

  // Dynamic import for RawImage
  const { RawImage } = await import('@xenova/transformers')

  // Convert input to a URL
  let imageUrl: string
  let shouldRevokeUrl = false

  if (typeof input === 'string') {
    imageUrl = input
  } else {
    imageUrl = URL.createObjectURL(input)
    shouldRevokeUrl = true
  }

  try {
    // Load image using RawImage
    const image = await RawImage.fromURL(imageUrl) as RawImageType

    // Report processing start
    onProgress?.(0.8)

    // Process image through the processor
    const { pixel_values } = await (processor as {
      (image: RawImageType): Promise<{ pixel_values: TensorType }>
    })(image)

    // Check for abort after preprocessing
    if (signal?.aborted) {
      throw new Error('Operation aborted')
    }

    // Run inference
    const { output } = await (model as {
      (input: { input: TensorType }): Promise<{ output: TensorType }>
    })({ input: pixel_values })

    // Check for abort after inference
    if (signal?.aborted) {
      throw new Error('Operation aborted')
    }

    onProgress?.(0.9)

    // Post-process the output
    // RMBG-1.4 outputs a tensor directly, not a nested object
    // Apply sigmoid to normalize, multiply by 255, and convert to uint8
    let maskTensor = output.sigmoid().mul(255).to('uint8')

    // If the tensor has a batch dimension (4D), squeeze it
    if (maskTensor.dims && maskTensor.dims.length === 4) {
      // Shape is [B, C, H, W], we need [C, H, W]
      maskTensor = maskTensor.squeeze(0)
    }

    // Convert tensor to RawImage (cast needed due to transformers.js types)
    const maskImage = (RawImage.fromTensor as unknown as (t: unknown) => RawImageType)(maskTensor)

    // Create output canvas
    const canvas = document.createElement('canvas')
    canvas.width = image.width
    canvas.height = image.height
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      throw new Error('Failed to create canvas context')
    }

    // Draw original image
    const imageCanvas = image.toCanvas()
    ctx.drawImage(imageCanvas, 0, 0)

    // Get image data
    const pixelData = ctx.getImageData(0, 0, canvas.width, canvas.height)

    // Create mask canvas and resize it to match the original image dimensions
    // Draw the mask to canvas first, then resize
    const tempMaskCanvas = document.createElement('canvas')
    tempMaskCanvas.width = maskImage.width
    tempMaskCanvas.height = maskImage.height

    // Put mask data on temp canvas
    const tempMaskCtx = tempMaskCanvas.getContext('2d')
    if (!tempMaskCtx) {
      throw new Error('Failed to create temp mask canvas context')
    }

    // Draw the mask image to the temp canvas
    const maskSourceCanvas = maskImage.toCanvas()
    tempMaskCtx.drawImage(maskSourceCanvas, 0, 0)

    // Now resize by drawing to a new canvas at the target size
    const maskCanvas = document.createElement('canvas')
    maskCanvas.width = image.width
    maskCanvas.height = image.height
    const maskCtx = maskCanvas.getContext('2d')
    if (!maskCtx) {
      throw new Error('Failed to create mask canvas context')
    }
    maskCtx.drawImage(tempMaskCanvas, 0, 0, image.width, image.height)
    const maskImageData = maskCtx.getImageData(0, 0, image.width, image.height)

    // Apply mask to alpha channel with thresholding
    // The mask is grayscale, so we use the red channel (R=G=B for grayscale)
    // Threshold creates clean binary separation: fully opaque foreground, fully transparent background
    // Invert threshold so lower slider values = stricter (remove more background)
    const thresholdValue = (1 - threshold) * 255
    for (let i = 0; i < pixelData.data.length; i += 4) {
      // Get mask value and apply threshold for clean binary mask
      const maskValue = maskImageData.data[i]
      // If mask value is above threshold, pixel is foreground (fully opaque)
      // Otherwise, pixel is background (fully transparent)
      pixelData.data[i + 3] = maskValue >= thresholdValue ? 255 : 0
    }

    // Put modified image data back
    ctx.putImageData(pixelData, 0, 0)

    onProgress?.(1.0)

    const processingTimeMs = performance.now() - startTime

    // Convert to blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) {
            resolve(b)
          } else {
            reject(new Error('Failed to create output blob'))
          }
        },
        'image/png',
        1.0
      )
    })

    return {
      blob,
      width: image.width,
      height: image.height,
      processingTimeMs,
    }
  } finally {
    if (shouldRevokeUrl) {
      URL.revokeObjectURL(imageUrl)
    }
  }
}

/**
 * Preload the model without processing an image
 * Useful for warming up the model before user interaction
 */
export async function preloadModel(
  onProgress?: (progress: number) => void
): Promise<void> {
  await initializeModel(onProgress)
}

/**
 * Check if the model is loaded and ready
 */
export function isModelLoaded(): boolean {
  return model !== null && processor !== null
}

/**
 * Get the current backend being used
 */
export function getCurrentBackend(): Backend | null {
  return currentBackend
}

/**
 * Reset the pipeline (useful for testing or when switching backends)
 */
export function resetPipeline(): void {
  model = null
  processor = null
  modelPromise = null
  currentBackend = null
}
