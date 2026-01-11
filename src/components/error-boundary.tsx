'use client'

/**
 * Error Boundary Component
 *
 * Catches React errors and displays a user-friendly error message.
 * Provides retry functionality for recoverable errors.
 */

import { Component, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  onReset?: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error for debugging
    console.error('Error caught by boundary:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null })
    this.props.onReset?.()
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <ErrorFallback
          error={this.state.error}
          onReset={this.handleReset}
        />
      )
    }

    return this.props.children
  }
}

interface ErrorFallbackProps {
  error: Error | null
  onReset?: () => void
  title?: string
  className?: string
}

export function ErrorFallback({
  error,
  onReset,
  title = 'Something went wrong',
  className = '',
}: ErrorFallbackProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center ${className}`}
      role="alert"
    >
      {/* Error icon */}
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

      {/* Error title */}
      <h2 className="text-lg font-medium text-foreground mb-2">{title}</h2>

      {/* Error message */}
      {error && (
        <p className="text-sm text-muted-foreground mb-4 max-w-md">
          {getUserFriendlyMessage(error)}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors"
          >
            Try again
          </button>
        )}
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-sm font-medium text-foreground bg-muted rounded-md hover:bg-muted/80 transition-colors"
        >
          Reload page
        </button>
      </div>

      {/* Technical details (collapsed by default) */}
      {error && process.env.NODE_ENV === 'development' && (
        <details className="mt-6 w-full max-w-lg text-left">
          <summary className="text-xs text-muted-foreground cursor-pointer">
            Technical details
          </summary>
          <pre className="mt-2 p-4 text-xs bg-muted rounded-md overflow-x-auto">
            {error.stack || error.message}
          </pre>
        </details>
      )}
    </div>
  )
}

/**
 * Convert technical error messages to user-friendly ones
 */
function getUserFriendlyMessage(error: Error): string {
  const message = error.message.toLowerCase()

  if (message.includes('network') || message.includes('fetch')) {
    return 'Network error. Please check your internet connection and try again.'
  }

  if (message.includes('memory') || message.includes('oom')) {
    return 'Out of memory. Try closing other tabs or using a smaller image.'
  }

  if (message.includes('abort') || message.includes('cancel')) {
    return 'Operation was cancelled.'
  }

  if (message.includes('webgpu') || message.includes('webgl')) {
    return 'Your browser may not support the required graphics features. Try using Chrome or Edge.'
  }

  if (message.includes('model') || message.includes('load')) {
    return 'Failed to load the AI model. Please try again.'
  }

  // Default to original message if no match
  return error.message
}

export default ErrorBoundary
