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
 *
 * Privacy-focused messaging emphasizes client-side processing.
 */

import { useRef, useCallback } from 'react'
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

  // Notify parent when image is ready
  const prevStateRef = useRef<ImageInputState['status']>('idle')
  if (state.status !== prevStateRef.current) {
    prevStateRef.current = state.status
    if (state.status === 'ready' && state.file && state.preview) {
      onImageReady?.(state.file, state.preview)
    }
    if (state.status === 'error' && state.error) {
      onError?.(state.error)
    }
  }

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
        relative w-full min-h-[300px] rounded-lg
        transition-all duration-200 ease-out
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${isDragging
          ? 'border-2 border-dashed border-primary bg-primary/5 scale-[1.02]'
          : 'border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/30'
        }
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
      {/* Upload icon */}
      <div className="mb-4 p-4 rounded-full bg-muted">
        <svg
          className="w-8 h-8 text-muted-foreground"
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

      {/* Instructions */}
      <h3 className="text-lg font-medium text-foreground mb-2">
        Drop your image here
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        or click to browse
      </p>

      {/* Supported formats */}
      <p className="text-xs text-muted-foreground/70">
        PNG, JPEG, WebP, or GIF
      </p>

      {/* Privacy badge */}
      <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground/60">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <span>Your images never leave your device</span>
      </div>
    </>
  )
}

function DraggingState() {
  return (
    <>
      <div className="mb-4 p-4 rounded-full bg-primary/10 animate-pulse">
        <svg
          className="w-8 h-8 text-primary"
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
      <h3 className="text-lg font-medium text-primary">
        Drop to upload
      </h3>
    </>
  )
}

function ValidatingState() {
  return (
    <>
      <div className="mb-4 p-4 rounded-full bg-muted">
        <svg
          className="w-8 h-8 text-muted-foreground animate-spin"
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
      <h3 className="text-lg font-medium text-foreground">
        Validating image...
      </h3>
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
      <div className="mb-4 p-4 rounded-full bg-destructive/10">
        <svg
          className="w-8 h-8 text-destructive"
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
      <h3 className="text-lg font-medium text-destructive mb-2">
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
        className="text-sm text-primary hover:text-primary/80 underline"
      >
        Try again
      </button>
    </>
  )
}

export default DropZone
