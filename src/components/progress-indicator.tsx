'use client'

/**
 * Progress Indicator Component
 *
 * Shows visual feedback during model loading and image processing:
 * - Animated circular progress
 * - Status text
 * - Cancel button
 * - Smooth animations
 * - Premium visual design
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
  const statusDescription = getStatusDescription(status)

  // Calculate circle properties
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progress * circumference)

  return (
    <div
      className={`flex flex-col items-center gap-6 p-8 ${className}`}
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={statusText}
    >
      {/* Animated circular progress */}
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />

        {/* Progress ring */}
        <div className="relative w-28 h-28">
          <svg
            className="w-full h-full -rotate-90"
            viewBox="0 0 100 100"
          >
            {/* Background circle */}
            <circle
              className="text-muted stroke-current"
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              strokeWidth="6"
            />
            {/* Progress circle */}
            <circle
              className="text-primary stroke-current transition-all duration-500 ease-out"
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-2xl font-bold text-foreground">
              {percentage}%
            </span>
          </div>
        </div>
      </div>

      {/* Status text */}
      <div className="text-center space-y-1">
        <p className="font-display text-lg font-semibold text-foreground">
          {statusText}
        </p>
        <p className="text-sm text-muted-foreground">
          {statusDescription}
        </p>
      </div>

      {/* Progress bar (secondary) */}
      <div className="w-full max-w-xs">
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Cancel button */}
      {onCancel && (
        <button
          type="button"
          onClick={handleCancel}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-2 rounded-lg hover:bg-muted/50"
        >
          Cancel
        </button>
      )}

      {/* Privacy reminder */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground/50">
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
        <span>Processing locally on your device</span>
      </div>
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
    if (progress < 0.9) {
      return 'Preparing...'
    }
    return 'Almost ready...'
  }

  if (status === 'processing') {
    if (progress < 0.3) {
      return 'Analyzing image...'
    }
    if (progress < 0.7) {
      return 'Removing background...'
    }
    return 'Finishing up...'
  }

  return 'Please wait...'
}

function getStatusDescription(status: ProcessingStatus): string {
  if (status === 'loading') {
    return 'Downloading AI model (first time only)'
  }
  if (status === 'processing') {
    return 'AI is processing your image'
  }
  return ''
}

export default ProgressIndicator
