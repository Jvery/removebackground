/**
 * Tests for Image Input Hook
 *
 * Tests the useImageInput hook's state management and handlers.
 * Note: Full component testing requires @testing-library/react.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useImageInput } from './use-image-input'
import * as imageValidation from './image-validation'

// Mock the entire module
vi.mock('./image-validation', () => ({
  validateImage: vi.fn(),
  createPreviewUrl: vi.fn(() => 'blob:test-preview-url'),
}))

describe('useImageInput', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:test-url')
    global.URL.revokeObjectURL = vi.fn()

    // Default mock implementations
    vi.mocked(imageValidation.validateImage).mockResolvedValue({
      valid: true,
      format: 'png',
      dimensions: { width: 100, height: 100 },
      fileSize: 1024,
      warnings: [],
    })
    vi.mocked(imageValidation.createPreviewUrl).mockReturnValue('blob:test-preview-url')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initial state', () => {
    it('starts with idle status', () => {
      const { result } = renderHook(() => useImageInput())

      expect(result.current.state.status).toBe('idle')
      expect(result.current.state.file).toBeNull()
      expect(result.current.state.preview).toBeNull()
      expect(result.current.state.error).toBeNull()
    })

    it('starts with isDragging false', () => {
      const { result } = renderHook(() => useImageInput())
      expect(result.current.isDragging).toBe(false)
    })
  })

  describe('reset', () => {
    it('resets state to initial values', async () => {
      const { result } = renderHook(() => useImageInput())

      // Simulate file selection
      const mockFile = new File(['test'], 'test.png', { type: 'image/png' })

      await act(async () => {
        result.current.handleFileSelect([mockFile] as unknown as FileList)
      })

      // Reset
      act(() => {
        result.current.reset()
      })

      expect(result.current.state.status).toBe('idle')
      expect(result.current.state.file).toBeNull()
      expect(result.current.state.preview).toBeNull()
    })
  })

  describe('handleFileSelect', () => {
    it('handles null or empty FileList', async () => {
      const { result } = renderHook(() => useImageInput())

      await act(async () => {
        result.current.handleFileSelect(null)
      })
      expect(result.current.state.status).toBe('idle')

      await act(async () => {
        result.current.handleFileSelect([] as unknown as FileList)
      })
      expect(result.current.state.status).toBe('idle')
    })

    it('processes valid file', async () => {
      const { result } = renderHook(() => useImageInput())
      const mockFile = new File(['test'], 'valid.png', { type: 'image/png' })

      act(() => {
        result.current.handleFileSelect([mockFile] as unknown as FileList)
      })

      await waitFor(() => {
        expect(result.current.state.status).toBe('ready')
      })

      expect(result.current.state.file).toBe(mockFile)
      expect(result.current.state.preview).toBeTruthy()
    })

    it('handles invalid file', async () => {
      // Mock invalid validation
      vi.mocked(imageValidation.validateImage).mockResolvedValue({
        valid: false,
        error: 'Invalid image',
        fileSize: 100,
        warnings: [],
      })

      const { result } = renderHook(() => useImageInput())
      const mockFile = new File(['test'], 'invalid.txt', { type: 'text/plain' })

      act(() => {
        result.current.handleFileSelect([mockFile] as unknown as FileList)
      })

      await waitFor(() => {
        expect(result.current.state.status).toBe('error')
      })

      expect(result.current.state.error).toBeTruthy()
    })
  })

  describe('clearError', () => {
    it('clears error and returns to idle', async () => {
      // Mock invalid validation
      vi.mocked(imageValidation.validateImage).mockResolvedValue({
        valid: false,
        error: 'Invalid image',
        fileSize: 100,
        warnings: [],
      })

      const { result } = renderHook(() => useImageInput())
      const mockFile = new File(['test'], 'invalid.txt', { type: 'text/plain' })

      // Trigger error
      act(() => {
        result.current.handleFileSelect([mockFile] as unknown as FileList)
      })

      await waitFor(() => {
        expect(result.current.state.status).toBe('error')
      })

      // Clear error
      act(() => {
        result.current.clearError()
      })

      expect(result.current.state.status).toBe('idle')
      expect(result.current.state.error).toBeNull()
    })
  })

  describe('drag events', () => {
    it('sets isDragging on dragEnter with files', () => {
      const { result } = renderHook(() => useImageInput())

      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        dataTransfer: {
          types: ['Files'],
        },
      } as unknown as React.DragEvent

      act(() => {
        result.current.handleDragEnter(mockEvent)
      })

      expect(result.current.isDragging).toBe(true)
    })

    it('clears isDragging on dragLeave', () => {
      const { result } = renderHook(() => useImageInput())

      const enterEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        dataTransfer: {
          types: ['Files'],
        },
      } as unknown as React.DragEvent

      const leaveEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as React.DragEvent

      act(() => {
        result.current.handleDragEnter(enterEvent)
      })
      expect(result.current.isDragging).toBe(true)

      act(() => {
        result.current.handleDragLeave(leaveEvent)
      })
      expect(result.current.isDragging).toBe(false)
    })
  })
})
