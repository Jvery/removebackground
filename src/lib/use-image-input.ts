'use client'

/**
 * Image Input Hook
 *
 * Handles various image input methods:
 * - Drag & drop
 * - Clipboard paste (Ctrl+V)
 * - File picker selection
 *
 * All processing happens client-side.
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  validateImage,
  createPreviewUrl,
  type DetailedValidation,
} from './image-validation'

export type InputStatus = 'idle' | 'dragging' | 'validating' | 'ready' | 'error'

export interface ImageInputState {
  status: InputStatus
  file: File | null
  preview: string | null
  validation: DetailedValidation | null
  error: string | null
}

export interface UseImageInputReturn {
  state: ImageInputState
  isDragging: boolean
  handleDrop: (event: React.DragEvent) => void
  handleDragOver: (event: React.DragEvent) => void
  handleDragEnter: (event: React.DragEvent) => void
  handleDragLeave: (event: React.DragEvent) => void
  handlePaste: (event: ClipboardEvent) => void
  handleFileSelect: (files: FileList | null) => void
  reset: () => void
  clearError: () => void
}

const initialState: ImageInputState = {
  status: 'idle',
  file: null,
  preview: null,
  validation: null,
  error: null,
}

export function useImageInput(): UseImageInputReturn {
  const [state, setState] = useState<ImageInputState>(initialState)
  const [isDragging, setIsDragging] = useState(false)
  const dragCounterRef = useRef(0)
  const previewUrlRef = useRef<string | null>(null)

  // Clean up preview URL on unmount or when preview changes
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
      }
    }
  }, [])

  const processFile = useCallback(async (file: File) => {
    // Clean up previous preview URL
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }

    setState({
      status: 'validating',
      file,
      preview: null,
      validation: null,
      error: null,
    })

    try {
      const validation = await validateImage(file)

      if (!validation.valid) {
        setState({
          status: 'error',
          file: null,
          preview: null,
          validation,
          error: validation.error || 'Invalid image',
        })
        return
      }

      // Create preview URL
      const previewUrl = createPreviewUrl(file)
      previewUrlRef.current = previewUrl

      setState({
        status: 'ready',
        file,
        preview: previewUrl,
        validation,
        error: null,
      })
    } catch (error) {
      setState({
        status: 'error',
        file: null,
        preview: null,
        validation: null,
        error: error instanceof Error ? error.message : 'Failed to process image',
      })
    }
  }, [])

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      event.stopPropagation()

      dragCounterRef.current = 0
      setIsDragging(false)

      const files = event.dataTransfer.files
      if (files.length === 0) return

      // Process first file only (could extend to handle multiple)
      const file = files[0]
      processFile(file)
    },
    [processFile]
  )

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
  }, [])

  const handleDragEnter = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()

    dragCounterRef.current++
    if (event.dataTransfer.types.includes('Files')) {
      setIsDragging(true)
    }
  }, [])

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()

    dragCounterRef.current--
    if (dragCounterRef.current === 0) {
      setIsDragging(false)
    }
  }, [])

  const handlePaste = useCallback(
    (event: ClipboardEvent) => {
      const items = event.clipboardData?.items
      if (!items) return

      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.type.startsWith('image/')) {
          event.preventDefault()
          const file = item.getAsFile()
          if (file) {
            processFile(file)
          }
          break
        }
      }
    },
    [processFile]
  )

  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return
      processFile(files[0])
    },
    [processFile]
  )

  const reset = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }
    dragCounterRef.current = 0
    setIsDragging(false)
    setState(initialState)
  }, [])

  const clearError = useCallback(() => {
    setState((prev) => ({
      ...prev,
      status: 'idle',
      error: null,
    }))
  }, [])

  // Set up global paste listener
  useEffect(() => {
    document.addEventListener('paste', handlePaste)
    return () => {
      document.removeEventListener('paste', handlePaste)
    }
  }, [handlePaste])

  return {
    state,
    isDragging,
    handleDrop,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handlePaste,
    handleFileSelect,
    reset,
    clearError,
  }
}
