'use client'

/**
 * Progress Indicator Component
 *
 * Shows visual feedback during model loading and image processing:
 * - Progress bar with percentage
 * - Status text
 * - Cancel button
 * - Smooth animations
 */

import { useCallback } from 'react'
import type { ProcessingStatus } from '@/lib/use-processing'

interface ProgressIndicatorProps {
  status: ProcessingStatus
  progress: number
  onCancel?: () => void
  className?: string
}

export function ProgressIndicator({
  status,
  progress,
  onCancel,
  className = '',
}: ProgressIndicatorProps) {
  const handleCancel = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      onCancel?.()
    },
    [onCancel]
  )

  if (status === 'idle' || status === 'complete' || status === 'error') {
    return null
  }

  const percentage = Math.round(progress * 100)
  const statusText = getStatusText(status, progress)

  return (
    <div
      className={`flex flex-col items-center gap-4 p-6 ${className}`}
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={statusText}
    >
      {/* Animated loading icon */}
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-muted">
          <svg
            className="absolute inset-0 w-16 h-16 -rotate-90"
            viewBox="0 0 64 64"
          >
            <circle
              className="text-primary transition-all duration-300 ease-out"
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${progress * 175.9} 175.9`}
            />
          </svg>
        </div>
        {/* Center percentage */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-medium text-foreground">
            {percentage}%
          </span>
        </div>
      </div>

      {/* Status text */}
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">{statusText}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {status === 'loading'
            ? 'Downloading AI model...'
            : 'Removing background...'}
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Cancel button */}
      {onCancel && (
        <button
          type="button"
          onClick={handleCancel}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
        >
          Cancel
        </button>
      )}
    </div>
  )
}

function getStatusText(status: ProcessingStatus, progress: number): string {
  if (status === 'loading') {
    if (progress < 0.1) {
      return 'Initializing...'
    }
    if (progress < 0.5) {
      return 'Loading AI model...'
    }
    return 'Almost ready...'
  }

  if (status === 'processing') {
    return 'Processing image...'
  }

  return 'Please wait...'
}

export default ProgressIndicator
