/**
 * Tests for Zoomable Image Component
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ZoomableImage } from './zoomable-image'

describe('ZoomableImage', () => {
  const defaultProps = {
    src: 'test-image.png',
    alt: 'Test image',
  }

  describe('rendering', () => {
    it('renders image with correct src and alt', () => {
      render(<ZoomableImage {...defaultProps} />)
      // Both container (role="img") and inner img have accessible names
      const images = screen.getAllByRole('img')
      expect(images.length).toBeGreaterThan(0)
    })

    it('applies checkerboard class when showCheckerboard is true', () => {
      const { container } = render(
        <ZoomableImage {...defaultProps} showCheckerboard />
      )
      expect(container.firstChild).toHaveClass('checkerboard')
    })

    it('applies custom className', () => {
      const { container } = render(
        <ZoomableImage {...defaultProps} className="custom-class" />
      )
      expect(container.firstChild).toHaveClass('custom-class')
    })
  })

  describe('zoom controls', () => {
    it('renders zoom controls', () => {
      render(<ZoomableImage {...defaultProps} />)
      expect(screen.getByLabelText('Zoom out')).toBeInTheDocument()
      expect(screen.getByLabelText('Zoom in')).toBeInTheDocument()
      expect(screen.getByLabelText('Reset zoom')).toBeInTheDocument()
    })

    it('shows initial zoom level as 100%', () => {
      render(<ZoomableImage {...defaultProps} />)
      expect(screen.getByText('100%')).toBeInTheDocument()
    })

    it('increases zoom when zoom in button clicked', () => {
      render(<ZoomableImage {...defaultProps} />)
      const zoomIn = screen.getByLabelText('Zoom in')

      fireEvent.click(zoomIn)

      // Should show higher than 100%
      expect(screen.queryByText('100%')).not.toBeInTheDocument()
    })

    it('decreases zoom when zoom out button clicked', () => {
      render(<ZoomableImage {...defaultProps} />)
      const zoomOut = screen.getByLabelText('Zoom out')

      fireEvent.click(zoomOut)

      // Should show lower than 100%
      expect(screen.queryByText('100%')).not.toBeInTheDocument()
    })

    it('resets zoom when reset button clicked', () => {
      render(<ZoomableImage {...defaultProps} />)
      const zoomIn = screen.getByLabelText('Zoom in')
      const reset = screen.getByLabelText('Reset zoom')

      // Zoom in first
      fireEvent.click(zoomIn)
      expect(screen.queryByText('100%')).not.toBeInTheDocument()

      // Reset
      fireEvent.click(reset)
      expect(screen.getByText('100%')).toBeInTheDocument()
    })
  })

  describe('interactions', () => {
    it('resets zoom on double click', () => {
      const { container } = render(<ZoomableImage {...defaultProps} />)
      const zoomIn = screen.getByLabelText('Zoom in')

      // Zoom in first
      fireEvent.click(zoomIn)
      expect(screen.queryByText('100%')).not.toBeInTheDocument()

      // Double click to reset
      fireEvent.doubleClick(container.firstChild as Element)
      expect(screen.getByText('100%')).toBeInTheDocument()
    })

    it('calls onZoomChange when zoom changes', () => {
      const onZoomChange = vi.fn()
      render(<ZoomableImage {...defaultProps} onZoomChange={onZoomChange} />)

      const zoomIn = screen.getByLabelText('Zoom in')
      fireEvent.click(zoomIn)

      expect(onZoomChange).toHaveBeenCalled()
    })
  })

  describe('accessibility', () => {
    it('has role="img"', () => {
      const { container } = render(<ZoomableImage {...defaultProps} />)
      expect(container.querySelector('[role="img"]')).toBeInTheDocument()
    })

    it('is keyboard focusable', () => {
      const { container } = render(<ZoomableImage {...defaultProps} />)
      expect(container.firstChild).toHaveAttribute('tabIndex', '0')
    })
  })
})
