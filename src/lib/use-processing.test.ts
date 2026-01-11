/**
 * Tests for Processing Hook
 *
 * Tests the useProcessing hook's state management and processing lifecycle.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useProcessing } from './use-processing'
import * as backgroundRemoval from './background-removal'

// Mock background-removal module
vi.mock('./background-removal', () => ({
  removeBackground: vi.fn(),
  preloadModel: vi.fn(),
  isModelLoaded: vi.fn(() => false),
}))

describe('useProcessing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:test-url')
    global.URL.revokeObjectURL = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initial state', () => {
    it('starts with idle status', () => {
      const { result } = renderHook(() => useProcessing())

      expect(result.current.state.status).toBe('idle')
      expect(result.current.state.progress).toBe(0)
      expect(result.current.state.originalImage).toBeNull()
      expect(result.current.state.processedImage).toBeNull()
      expect(result.current.state.error).toBeNull()
    })

    it('reports model not ready initially', () => {
      const { result } = renderHook(() => useProcessing())
      expect(result.current.isModelReady).toBe(false)
    })
  })

  describe('processImage', () => {
    it('transitions through loading state', async () => {
      vi.mocked(backgroundRemoval.removeBackground).mockImplementation(
        async (_, options) => {
          options?.onProgress?.(0.5)
          return {
            blob: new Blob(['test'], { type: 'image/png' }),
            width: 100,
            height: 100,
            processingTimeMs: 1000,
          }
        }
      )

      const { result } = renderHook(() => useProcessing())
      const mockFile = new File(['test'], 'test.png', { type: 'image/png' })

      act(() => {
        result.current.processImage(mockFile)
      })

      // Should immediately transition to loading
      expect(result.current.state.status).toBe('loading')
      expect(result.current.state.originalImage).not.toBeNull()

      await waitFor(() => {
        expect(result.current.state.status).toBe('complete')
      })

      expect(result.current.state.processedImage).not.toBeNull()
      expect(result.current.state.processingTimeMs).toBe(1000)
    })

    it('handles processing errors', async () => {
      vi.mocked(backgroundRemoval.removeBackground).mockRejectedValue(
        new Error('Processing failed')
      )

      const { result } = renderHook(() => useProcessing())
      const mockFile = new File(['test'], 'test.png', { type: 'image/png' })

      act(() => {
        result.current.processImage(mockFile)
      })

      await waitFor(() => {
        expect(result.current.state.status).toBe('error')
      })

      expect(result.current.state.error).toBe('Processing failed')
    })
  })

  describe('cancel', () => {
    it('cancels processing and returns to idle', async () => {
      let abortSignal: AbortSignal | undefined

      vi.mocked(backgroundRemoval.removeBackground).mockImplementation(
        async (_, options) => {
          abortSignal = options?.signal
          // Simulate long processing
          await new Promise((resolve) => setTimeout(resolve, 1000))
          return {
            blob: new Blob(['test'], { type: 'image/png' }),
            width: 100,
            height: 100,
            processingTimeMs: 1000,
          }
        }
      )

      const { result } = renderHook(() => useProcessing())
      const mockFile = new File(['test'], 'test.png', { type: 'image/png' })

      act(() => {
        result.current.processImage(mockFile)
      })

      // Cancel immediately
      act(() => {
        result.current.cancel()
      })

      expect(result.current.state.status).toBe('idle')
    })
  })

  describe('reset', () => {
    it('resets state to initial values', async () => {
      vi.mocked(backgroundRemoval.removeBackground).mockResolvedValue({
        blob: new Blob(['test'], { type: 'image/png' }),
        width: 100,
        height: 100,
        processingTimeMs: 500,
      })

      const { result } = renderHook(() => useProcessing())
      const mockFile = new File(['test'], 'test.png', { type: 'image/png' })

      // Process an image
      act(() => {
        result.current.processImage(mockFile)
      })

      await waitFor(() => {
        expect(result.current.state.status).toBe('complete')
      })

      // Reset
      act(() => {
        result.current.reset()
      })

      expect(result.current.state.status).toBe('idle')
      expect(result.current.state.originalImage).toBeNull()
      expect(result.current.state.processedImage).toBeNull()
    })

    it('cleans up blob URLs on reset', async () => {
      vi.mocked(backgroundRemoval.removeBackground).mockResolvedValue({
        blob: new Blob(['test'], { type: 'image/png' }),
        width: 100,
        height: 100,
        processingTimeMs: 500,
      })

      const { result } = renderHook(() => useProcessing())
      const mockFile = new File(['test'], 'test.png', { type: 'image/png' })

      act(() => {
        result.current.processImage(mockFile)
      })

      await waitFor(() => {
        expect(result.current.state.status).toBe('complete')
      })

      act(() => {
        result.current.reset()
      })

      // URL.revokeObjectURL should have been called
      expect(global.URL.revokeObjectURL).toHaveBeenCalled()
    })
  })

  describe('preload', () => {
    it('preloads model and returns to idle', async () => {
      vi.mocked(backgroundRemoval.preloadModel).mockResolvedValue()
      vi.mocked(backgroundRemoval.isModelLoaded).mockReturnValue(false)

      const { result } = renderHook(() => useProcessing())

      act(() => {
        result.current.preload()
      })

      expect(result.current.state.status).toBe('loading')

      await waitFor(() => {
        expect(result.current.state.status).toBe('idle')
      })
    })

    it('handles preload errors', async () => {
      vi.mocked(backgroundRemoval.preloadModel).mockRejectedValue(
        new Error('Model load failed')
      )
      vi.mocked(backgroundRemoval.isModelLoaded).mockReturnValue(false)

      const { result } = renderHook(() => useProcessing())

      act(() => {
        result.current.preload()
      })

      await waitFor(() => {
        expect(result.current.state.status).toBe('error')
      })

      expect(result.current.state.error).toBe('Model load failed')
    })
  })
})
