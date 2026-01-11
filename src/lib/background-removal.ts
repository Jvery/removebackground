/**
 * Background Removal Core Module
 *
 * Uses @xenova/transformers with briaai/RMBG-1.4 model for client-side
 * background removal. All processing happens in the browser - no server uploads.
 */

import { detectBestBackend, type Backend } from './backend-detection'

// Model configuration
const MODEL_ID = 'briaai/RMBG-1.4'

// Pipeline state
let pipeline: unknown | null = null
let pipelinePromise: Promise<unknown> | null = null
let currentBackend: Backend | null = null

export interface RemovalOptions {
  onProgress?: (progress: number) => void
  signal?: AbortSignal
}

export interface RemovalResult {
  blob: Blob
  width: number
  height: number
  processingTimeMs: number
}

interface SegmentationSegment {
  label?: string
  mask?: {
    width: number
    height: number
    data: number[]
  }
}

/**
 * Initialize the background removal pipeline
 * Lazy loads @xenova/transformers to avoid blocking initial page load
 */
async function initializePipeline(
  onProgress?: (progress: number) => void
): Promise<unknown> {
  // Return existing pipeline if already initialized
  if (pipeline) {
    return pipeline
  }

  // Return existing promise if initialization is in progress
  if (pipelinePromise) {
    return pipelinePromise
  }

  pipelinePromise = (async () => {
    // Detect best backend
    currentBackend = await detectBestBackend()

    // Dynamic import to avoid bundling transformers.js with initial page load
    const { pipeline: createPipeline, env } = await import('@xenova/transformers')

    // Configure environment based on detected backend
    if (currentBackend === 'webgpu') {
      env.backends.onnx.wasm.proxy = false
    }

    // Report progress for model loading
    onProgress?.(0.1)

    // Create the image segmentation pipeline
    const pipe = await createPipeline('image-segmentation', MODEL_ID, {
      progress_callback: (progress: { progress?: number; status?: string }) => {
        if (progress.progress !== undefined) {
          // Scale progress: model loading is 10-90% of total progress
          const scaledProgress = 0.1 + (progress.progress / 100) * 0.8
          onProgress?.(scaledProgress)
        }
      },
    })

    onProgress?.(0.9)

    pipeline = pipe
    return pipe
  })()

  return pipelinePromise
}

/**
 * Remove background from an image
 */
export async function removeBackground(
  input: File | Blob | string,
  options?: RemovalOptions
): Promise<RemovalResult> {
  const startTime = performance.now()
  const { onProgress, signal } = options || {}

  // Check for abort before starting
  if (signal?.aborted) {
    throw new Error('Operation aborted')
  }

  // Initialize pipeline (lazy load)
  const pipe = await initializePipeline(onProgress)

  // Check for abort after model loading
  if (signal?.aborted) {
    throw new Error('Operation aborted')
  }

  // Convert input to a URL or blob URL
  let imageUrl: string
  let shouldRevokeUrl = false

  if (typeof input === 'string') {
    imageUrl = input
  } else {
    imageUrl = URL.createObjectURL(input)
    shouldRevokeUrl = true
  }

  try {
    // Load image to get dimensions
    const img = await loadImage(imageUrl)
    const { width, height } = img

    // Report processing start
    onProgress?.(0.9)

    // Run inference
    const result = await (pipe as (url: string) => Promise<unknown>)(imageUrl)

    // Check for abort after inference
    if (signal?.aborted) {
      throw new Error('Operation aborted')
    }

    // Extract mask and apply to original image
    const outputBlob = await applyMaskToImage(img, result as SegmentationSegment[])

    onProgress?.(1.0)

    const processingTimeMs = performance.now() - startTime

    return {
      blob: outputBlob,
      width,
      height,
      processingTimeMs,
    }
  } finally {
    if (shouldRevokeUrl) {
      URL.revokeObjectURL(imageUrl)
    }
  }
}

/**
 * Load an image from a URL
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = url
  })
}

/**
 * Apply the segmentation mask to the original image
 */
async function applyMaskToImage(
  img: HTMLImageElement,
  segmentationResult: SegmentationSegment[]
): Promise<Blob> {
  const { width, height } = img

  // Create canvas for compositing
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Failed to create canvas context')
  }

  // Draw original image
  ctx.drawImage(img, 0, 0)

  // Get image data
  const imageData = ctx.getImageData(0, 0, width, height)

  // Handle different segmentation result formats from Transformers.js
  // The result is typically an array of segments
  if (Array.isArray(segmentationResult) && segmentationResult.length > 0) {
    // Find the foreground mask (typically labeled as "foreground" or the non-background segment)
    const foregroundSegment = segmentationResult.find(
      (seg) => seg.label?.toLowerCase() !== 'background'
    ) || segmentationResult[0]

    if (foregroundSegment?.mask) {
      const mask = foregroundSegment.mask

      // Create a canvas for the mask
      const maskCanvas = document.createElement('canvas')
      maskCanvas.width = mask.width
      maskCanvas.height = mask.height
      const maskCtx = maskCanvas.getContext('2d')

      if (maskCtx) {
        // Draw mask data
        const maskImageData = maskCtx.createImageData(mask.width, mask.height)

        // Convert mask data to image data
        for (let i = 0; i < mask.data.length; i++) {
          const alpha = mask.data[i] * 255
          maskImageData.data[i * 4] = 255     // R
          maskImageData.data[i * 4 + 1] = 255 // G
          maskImageData.data[i * 4 + 2] = 255 // B
          maskImageData.data[i * 4 + 3] = alpha // A
        }

        maskCtx.putImageData(maskImageData, 0, 0)

        // Scale mask to original image size if needed
        if (mask.width !== width || mask.height !== height) {
          const scaledMaskCanvas = document.createElement('canvas')
          scaledMaskCanvas.width = width
          scaledMaskCanvas.height = height
          const scaledMaskCtx = scaledMaskCanvas.getContext('2d')

          if (scaledMaskCtx) {
            scaledMaskCtx.drawImage(maskCanvas, 0, 0, width, height)
            const scaledMaskData = scaledMaskCtx.getImageData(0, 0, width, height)

            // Apply mask to original image
            for (let i = 0; i < imageData.data.length; i += 4) {
              // Use the mask's alpha channel
              imageData.data[i + 3] = scaledMaskData.data[i + 3]
            }
          }
        } else {
          const maskData = maskCtx.getImageData(0, 0, width, height)

          // Apply mask to original image
          for (let i = 0; i < imageData.data.length; i += 4) {
            imageData.data[i + 3] = maskData.data[i + 3]
          }
        }
      }
    }
  }

  // Put modified image data back
  ctx.putImageData(imageData, 0, 0)

  // Convert to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to create output blob'))
        }
      },
      'image/png',
      1.0
    )
  })
}

/**
 * Preload the model without processing an image
 * Useful for warming up the model before user interaction
 */
export async function preloadModel(
  onProgress?: (progress: number) => void
): Promise<void> {
  await initializePipeline(onProgress)
}

/**
 * Check if the model is loaded and ready
 */
export function isModelLoaded(): boolean {
  return pipeline !== null
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
  pipeline = null
  pipelinePromise = null
  currentBackend = null
}
