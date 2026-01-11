/**
 * Tests for Progress Indicator Component
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ProgressIndicator } from './progress-indicator'

describe('ProgressIndicator', () => {
  describe('visibility', () => {
    it('renders nothing when status is idle', () => {
      const { container } = render(
        <ProgressIndicator status="idle" progress={0} />
      )
      expect(container.firstChild).toBeNull()
    })

    it('renders nothing when status is complete', () => {
      const { container } = render(
        <ProgressIndicator status="complete" progress={1} />
      )
      expect(container.firstChild).toBeNull()
    })

    it('renders nothing when status is error', () => {
      const { container } = render(
        <ProgressIndicator status="error" progress={0} />
      )
      expect(container.firstChild).toBeNull()
    })

    it('renders when status is loading', () => {
      render(<ProgressIndicator status="loading" progress={0.5} />)
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    it('renders when status is processing', () => {
      render(<ProgressIndicator status="processing" progress={0.95} />)
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })
  })

  describe('progress display', () => {
    it('shows correct percentage', () => {
      render(<ProgressIndicator status="loading" progress={0.75} />)
      expect(screen.getByText('75%')).toBeInTheDocument()
    })

    it('rounds percentage correctly', () => {
      render(<ProgressIndicator status="loading" progress={0.333} />)
      expect(screen.getByText('33%')).toBeInTheDocument()
    })
  })

  describe('status text', () => {
    it('shows initializing text at start', () => {
      render(<ProgressIndicator status="loading" progress={0.05} />)
      expect(screen.getByText('Initializing...')).toBeInTheDocument()
    })

    it('shows loading text during model load', () => {
      render(<ProgressIndicator status="loading" progress={0.3} />)
      expect(screen.getByText('Loading AI model...')).toBeInTheDocument()
    })

    it('shows preparing text during mid-loading', () => {
      render(<ProgressIndicator status="loading" progress={0.6} />)
      expect(screen.getByText('Preparing...')).toBeInTheDocument()
    })

    it('shows almost ready text near completion', () => {
      render(<ProgressIndicator status="loading" progress={0.95} />)
      expect(screen.getByText('Almost ready...')).toBeInTheDocument()
    })

    it('shows finishing up text when processing is nearly done', () => {
      render(<ProgressIndicator status="processing" progress={0.95} />)
      expect(screen.getByText('Finishing up...')).toBeInTheDocument()
    })

    it('shows removing background text during processing', () => {
      render(<ProgressIndicator status="processing" progress={0.5} />)
      expect(screen.getByText('Removing background...')).toBeInTheDocument()
    })
  })

  describe('cancel button', () => {
    it('renders cancel button when onCancel provided', () => {
      render(
        <ProgressIndicator status="loading" progress={0.5} onCancel={() => {}} />
      )
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })

    it('does not render cancel button when onCancel not provided', () => {
      render(<ProgressIndicator status="loading" progress={0.5} />)
      expect(screen.queryByText('Cancel')).not.toBeInTheDocument()
    })

    it('calls onCancel when clicked', () => {
      const onCancel = vi.fn()
      render(
        <ProgressIndicator status="loading" progress={0.5} onCancel={onCancel} />
      )

      fireEvent.click(screen.getByText('Cancel'))
      expect(onCancel).toHaveBeenCalledTimes(1)
    })
  })

  describe('accessibility', () => {
    it('has correct ARIA attributes', () => {
      render(<ProgressIndicator status="loading" progress={0.5} />)
      const progressbar = screen.getByRole('progressbar')

      expect(progressbar).toHaveAttribute('aria-valuenow', '50')
      expect(progressbar).toHaveAttribute('aria-valuemin', '0')
      expect(progressbar).toHaveAttribute('aria-valuemax', '100')
    })
  })
})
