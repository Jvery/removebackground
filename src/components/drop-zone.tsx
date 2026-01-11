'use client'

/**
 * Drop Zone Component
 *
 * Visual drop target for image upload with:
 * - Drag & drop support
 * - Click to browse
 * - Paste from clipboard
 * - Validation feedback
 * - Loading state
 * - Premium visual design
 *
 * Privacy-focused messaging emphasizes client-side processing.
 */

import { useRef, useCallback, useEffect } from 'react'
import { useImageInput, type ImageInputState } from '@/lib/use-image-input'

interface DropZoneProps {
  onImageReady?: (file: File, preview: string) => void
  onError?: (error: string) => void
  disabled?: boolean
  className?: string
}

export function DropZone({
  onImageReady,
  onError,
  disabled = false,
  className = '',
}: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const {
    state,
    isDragging,
    handleDrop,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleFileSelect,
    reset,
    clearError,
  } = useImageInput()

  // Notify parent when image is ready - using useEffect to avoid setState during render
  const prevStateRef = useRef<ImageInputState['status']>('idle')
  useEffect(() => {
    if (state.status !== prevStateRef.current) {
      prevStateRef.current = state.status
      if (state.status === 'ready' && state.file && state.preview) {
        onImageReady?.(state.file, state.preview)
      }
      if (state.status === 'error' && state.error) {
        onError?.(state.error)
      }
    }
  }, [state.status, state.file, state.preview, state.error, onImageReady, onError])

  const handleClick = useCallback(() => {
    if (!disabled) {
      inputRef.current?.click()
    }
  }, [disabled])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        handleClick()
      }
    },
    [handleClick]
  )

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      handleFileSelect(event.target.files)
      // Reset input so same file can be selected again
      event.target.value = ''
    },
    [handleFileSelect]
  )

  const isValidating = state.status === 'validating'
  const hasError = state.status === 'error'

  return (
    <div
      className={`
        drop-zone relative w-full min-h-[320px] cursor-pointer
        transition-all duration-300 ease-out
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${isDragging ? 'dragging' : ''}
        ${hasError ? 'border-destructive/50 bg-destructive/5' : ''}
        ${className}
      `}
      onDrop={disabled ? undefined : handleDrop}
      onDragOver={disabled ? undefined : handleDragOver}
      onDragEnter={disabled ? undefined : handleDragEnter}
      onDragLeave={disabled ? undefined : handleDragLeave}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
      role="button"
      aria-label="Upload image. Click to browse or drag and drop an image file."
      aria-disabled={disabled}
      aria-busy={isValidating}
    >
      {/* Corner decorations */}
      <div className="absolute top-3 left-3 w-8 h-8 border-l-2 border-t-2 border-primary/30 rounded-tl-lg pointer-events-none" />
      <div className="absolute top-3 right-3 w-8 h-8 border-r-2 border-t-2 border-primary/30 rounded-tr-lg pointer-events-none" />
      <div className="absolute bottom-3 left-3 w-8 h-8 border-l-2 border-b-2 border-primary/30 rounded-bl-lg pointer-events-none" />
      <div className="absolute bottom-3 right-3 w-8 h-8 border-r-2 border-b-2 border-primary/30 rounded-br-lg pointer-events-none" />

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
        {isValidating ? (
          <ValidatingState />
        ) : hasError ? (
          <ErrorState error={state.error} onDismiss={clearError} />
        ) : isDragging ? (
          <DraggingState />
        ) : (
          <IdleState />
        )}
      </div>
    </div>
  )
}

function IdleState() {
  return (
    <>
      {/* Upload icon with glow effect */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl animate-pulse" />
        <div className="relative p-5 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
          <svg
            className="w-10 h-10 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      </div>

      {/* Instructions */}
      <h3 className="font-display text-xl font-semibold text-foreground mb-2">
        Drop your image here
      </h3>
      <p className="text-sm text-muted-foreground mb-1">
        or <span className="text-primary font-medium">click to browse</span>
      </p>
      <p className="text-xs text-muted-foreground/60 mb-6">
        Paste from clipboard also works (Ctrl/Cmd + V)
      </p>

      {/* Supported formats */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
        <span className="px-2 py-1 rounded bg-muted/50">PNG</span>
        <span className="px-2 py-1 rounded bg-muted/50">JPEG</span>
        <span className="px-2 py-1 rounded bg-muted/50">WebP</span>
        <span className="px-2 py-1 rounded bg-muted/50">GIF</span>
      </div>

      {/* Privacy indicator */}
      <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground/50">
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <span>Processed locally — never uploaded</span>
      </div>
    </>
  )
}

function DraggingState() {
  return (
    <>
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-primary/30 rounded-2xl blur-xl animate-pulse" />
        <div className="relative p-5 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/40 animate-float">
          <svg
            className="w-10 h-10 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>
      </div>
      <h3 className="font-display text-xl font-semibold text-primary">
        Drop to upload
      </h3>
      <p className="text-sm text-primary/70 mt-2">
        Release to start processing
      </p>
    </>
  )
}

function ValidatingState() {
  return (
    <>
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl" />
        <div className="relative p-5 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
          <svg
            className="w-10 h-10 text-primary animate-spin"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      </div>
      <h3 className="font-display text-xl font-semibold text-foreground">
        Validating image...
      </h3>
      <p className="text-sm text-muted-foreground mt-2">
        Checking file type and dimensions
      </p>
    </>
  )
}

interface ErrorStateProps {
  error: string | null
  onDismiss: () => void
}

function ErrorState({ error, onDismiss }: ErrorStateProps) {
  return (
    <>
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-destructive/20 rounded-2xl blur-xl" />
        <div className="relative p-5 rounded-2xl bg-gradient-to-br from-destructive/10 to-destructive/5 border border-destructive/30">
          <svg
            className="w-10 h-10 text-destructive"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
      </div>
      <h3 className="font-display text-xl font-semibold text-destructive mb-2">
        Upload failed
      </h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-xs">
        {error || 'An unknown error occurred'}
      </p>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onDismiss()
        }}
        className="px-4 py-2 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
      >
        Try again
      </button>
    </>
  )
}

export default DropZone
