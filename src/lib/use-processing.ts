'use client'

/**
 * Processing Hook
 *
 * Manages the background removal processing lifecycle:
 * idle -> loading -> processing -> complete | error
 *
 * Handles model loading, image processing, and cancellation.
 */

import { useState, useCallback, useRef } from 'react'
import {
  removeBackground,
  preloadModel,
  isModelLoaded,
  type RemovalResult,
} from './background-removal'

export type ProcessingStatus = 'idle' | 'loading' | 'processing' | 'complete' | 'error'

export interface ProcessingState {
  status: ProcessingStatus
  progress: number
  originalImage: {
    file: File
    url: string
  } | null
  processedImage: {
    blob: Blob
    url: string
    width: number
    height: number
  } | null
  error: string | null
  processingTimeMs: number | null
}

export interface ProcessingOptions {
  /**
   * Threshold for binarizing the mask (0-1).
   * Values above this threshold become fully opaque.
   * Values below become fully transparent.
   * Default is 0.5.
   */
  threshold?: number
}

export interface UseProcessingReturn {
  state: ProcessingState
  processImage: (file: File, options?: ProcessingOptions) => Promise<void>
  reprocessWithThreshold: (threshold: number) => Promise<void>
  preload: () => Promise<void>
  cancel: () => void
  reset: () => void
  isModelReady: boolean
}

const initialState: ProcessingState = {
  status: 'idle',
  progress: 0,
  originalImage: null,
  processedImage: null,
  error: null,
  processingTimeMs: null,
}

export function useProcessing(): UseProcessingReturn {
  const [state, setState] = useState<ProcessingState>(initialState)
  const abortControllerRef = useRef<AbortController | null>(null)
  const originalUrlRef = useRef<string | null>(null)
  const processedUrlRef = useRef<string | null>(null)
  const currentFileRef = useRef<File | null>(null)

  // Cleanup URLs
  const cleanupUrls = useCallback(() => {
    if (originalUrlRef.current) {
      URL.revokeObjectURL(originalUrlRef.current)
      originalUrlRef.current = null
    }
    if (processedUrlRef.current) {
      URL.revokeObjectURL(processedUrlRef.current)
      processedUrlRef.current = null
    }
  }, [])

  const processImage = useCallback(async (file: File, options?: ProcessingOptions) => {
    // Cancel any existing processing
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Cleanup previous URLs
    cleanupUrls()

    // Store file reference for reprocessing
    currentFileRef.current = file

    // Create new abort controller
    abortControllerRef.current = new AbortController()
    const { signal } = abortControllerRef.current

    // Create URL for original image
    const originalUrl = URL.createObjectURL(file)
    originalUrlRef.current = originalUrl

    // Start loading (model loading phase)
    setState({
      status: 'loading',
      progress: 0,
      originalImage: { file, url: originalUrl },
      processedImage: null,
      error: null,
      processingTimeMs: null,
    })

    try {
      // Process the image
      const result = await removeBackground(file, {
        onProgress: (progress) => {
          // Progress 0-0.9 is loading/processing, 0.9-1.0 is final processing
          if (progress < 0.9) {
            setState((prev) => ({
              ...prev,
              status: 'loading',
              progress: progress,
            }))
          } else {
            setState((prev) => ({
              ...prev,
              status: 'processing',
              progress: progress,
            }))
          }
        },
        signal,
        threshold: options?.threshold,
      })

      // Check if aborted
      if (signal.aborted) {
        return
      }

      // Create URL for processed image
      const processedUrl = URL.createObjectURL(result.blob)
      processedUrlRef.current = processedUrl

      // Complete
      setState({
        status: 'complete',
        progress: 1,
        originalImage: { file, url: originalUrl },
        processedImage: {
          blob: result.blob,
          url: processedUrl,
          width: result.width,
          height: result.height,
        },
        error: null,
        processingTimeMs: result.processingTimeMs,
      })
    } catch (error) {
      // Don't update state if aborted
      if (signal.aborted) {
        return
      }

      setState((prev) => ({
        ...prev,
        status: 'error',
        progress: 0,
        error: error instanceof Error ? error.message : 'Processing failed',
      }))
    }
  }, [cleanupUrls])

  // Reprocess the current image with a new threshold
  const reprocessWithThreshold = useCallback(async (threshold: number) => {
    if (!currentFileRef.current) {
      return
    }

    // Cancel any existing processing
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Cleanup only processed URL (keep original)
    if (processedUrlRef.current) {
      URL.revokeObjectURL(processedUrlRef.current)
      processedUrlRef.current = null
    }

    const file = currentFileRef.current

    // Create new abort controller
    abortControllerRef.current = new AbortController()
    const { signal } = abortControllerRef.current

    // Start processing (model already loaded, so skip loading state)
    setState((prev) => ({
      ...prev,
      status: 'processing',
      progress: 0.7,
      processedImage: null,
      error: null,
    }))

    try {
      const result = await removeBackground(file, {
        onProgress: (progress) => {
          // Only show progress for the processing phase
          if (progress >= 0.7) {
            setState((prev) => ({
              ...prev,
              progress: progress,
            }))
          }
        },
        signal,
        threshold,
      })

      if (signal.aborted) {
        return
      }

      const processedUrl = URL.createObjectURL(result.blob)
      processedUrlRef.current = processedUrl

      setState((prev) => ({
        ...prev,
        status: 'complete',
        progress: 1,
        processedImage: {
          blob: result.blob,
          url: processedUrl,
          width: result.width,
          height: result.height,
        },
        processingTimeMs: result.processingTimeMs,
      }))
    } catch (error) {
      if (signal.aborted) {
        return
      }

      setState((prev) => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Processing failed',
      }))
    }
  }, [])

  const preload = useCallback(async () => {
    if (isModelLoaded()) {
      return
    }

    setState((prev) => ({
      ...prev,
      status: 'loading',
      progress: 0,
    }))

    try {
      await preloadModel((progress) => {
        setState((prev) => ({
          ...prev,
          progress,
        }))
      })

      setState((prev) => ({
        ...prev,
        status: 'idle',
        progress: 0,
      }))
    } catch (error) {
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to load model',
      }))
    }
  }, [])

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }

    setState((prev) => ({
      ...prev,
      status: 'idle',
      progress: 0,
    }))
  }, [])

  const reset = useCallback(() => {
    // Cancel any ongoing processing
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }

    // Cleanup URLs
    cleanupUrls()

    // Reset state
    setState(initialState)
  }, [cleanupUrls])

  return {
    state,
    processImage,
    reprocessWithThreshold,
    preload,
    cancel,
    reset,
    isModelReady: isModelLoaded(),
  }
}
