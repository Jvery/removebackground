/**
 * Tests for Error Boundary Component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorBoundary, ErrorFallback } from './error-boundary'

describe('ErrorFallback', () => {
  describe('rendering', () => {
    it('renders error title', () => {
      render(<ErrorFallback error={null} />)
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })

    it('renders custom title', () => {
      render(<ErrorFallback error={null} title="Custom Error" />)
      expect(screen.getByText('Custom Error')).toBeInTheDocument()
    })

    it('renders error message', () => {
      const error = new Error('Test error message')
      render(<ErrorFallback error={error} />)
      expect(screen.getByText('Test error message')).toBeInTheDocument()
    })

    it('converts network errors to user-friendly messages', () => {
      const error = new Error('Network request failed')
      render(<ErrorFallback error={error} />)
      expect(
        screen.getByText(/network error/i)
      ).toBeInTheDocument()
    })

    it('converts memory errors to user-friendly messages', () => {
      const error = new Error('Out of memory')
      render(<ErrorFallback error={error} />)
      expect(screen.getByText(/out of memory/i)).toBeInTheDocument()
    })
  })

  describe('actions', () => {
    it('renders reload button', () => {
      render(<ErrorFallback error={null} />)
      expect(screen.getByText('Reload page')).toBeInTheDocument()
    })

    it('renders try again button when onReset provided', () => {
      render(<ErrorFallback error={null} onReset={() => {}} />)
      expect(screen.getByText('Try again')).toBeInTheDocument()
    })

    it('calls onReset when try again clicked', () => {
      const onReset = vi.fn()
      render(<ErrorFallback error={null} onReset={onReset} />)

      fireEvent.click(screen.getByText('Try again'))
      expect(onReset).toHaveBeenCalledTimes(1)
    })
  })

  describe('accessibility', () => {
    it('has alert role', () => {
      render(<ErrorFallback error={null} />)
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })
})

describe('ErrorBoundary', () => {
  // Suppress console errors during tests
  const originalError = console.error
  beforeEach(() => {
    console.error = vi.fn()
  })
  afterEach(() => {
    console.error = originalError
  })

  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    )
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('renders fallback when error thrown', () => {
    const ThrowError = () => {
      throw new Error('Test error')
    }

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('renders custom fallback when provided', () => {
    const ThrowError = () => {
      throw new Error('Test error')
    }

    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByText('Custom fallback')).toBeInTheDocument()
  })

  it('calls onError when error caught', () => {
    const onError = vi.fn()
    const ThrowError = () => {
      throw new Error('Test error')
    }

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(onError).toHaveBeenCalled()
  })

  it('resets error state when try again clicked', () => {
    let shouldThrow = true
    const MaybeThrow = () => {
      if (shouldThrow) {
        throw new Error('Test error')
      }
      return <div>Recovered content</div>
    }

    const { rerender } = render(
      <ErrorBoundary>
        <MaybeThrow />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    // Don't throw on next render
    shouldThrow = false

    // Click try again
    fireEvent.click(screen.getByText('Try again'))

    // Re-render to trigger component mount
    rerender(
      <ErrorBoundary>
        <MaybeThrow />
      </ErrorBoundary>
    )

    expect(screen.getByText('Recovered content')).toBeInTheDocument()
  })
})
