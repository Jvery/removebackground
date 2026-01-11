/**
 * Tests for Comparison Slider Component
 */

import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ComparisonSlider } from './comparison-slider'

describe('ComparisonSlider', () => {
  const defaultProps = {
    originalSrc: 'original.png',
    processedSrc: 'processed.png',
  }

  describe('rendering', () => {
    it('renders both images', () => {
      render(<ComparisonSlider {...defaultProps} />)
      const images = screen.getAllByRole('img')
      expect(images).toHaveLength(2)
    })

    it('renders labels', () => {
      render(<ComparisonSlider {...defaultProps} />)
      expect(screen.getByText('Original')).toBeInTheDocument()
      expect(screen.getByText('Processed')).toBeInTheDocument()
    })

    it('applies custom className', () => {
      const { container } = render(
        <ComparisonSlider {...defaultProps} className="custom-class" />
      )
      expect(container.firstChild).toHaveClass('custom-class')
    })
  })

  describe('slider position', () => {
    it('starts at default position (50%)', () => {
      render(<ComparisonSlider {...defaultProps} />)
      const slider = screen.getByRole('slider')
      expect(slider).toHaveAttribute('aria-valuenow', '50')
    })

    it('respects initial position prop', () => {
      render(<ComparisonSlider {...defaultProps} initialPosition={75} />)
      const slider = screen.getByRole('slider')
      expect(slider).toHaveAttribute('aria-valuenow', '75')
    })
  })

  describe('keyboard navigation', () => {
    it('moves left on ArrowLeft', () => {
      render(<ComparisonSlider {...defaultProps} />)
      const slider = screen.getByRole('slider')

      fireEvent.keyDown(slider, { key: 'ArrowLeft' })

      expect(slider).toHaveAttribute('aria-valuenow', '48')
    })

    it('moves right on ArrowRight', () => {
      render(<ComparisonSlider {...defaultProps} />)
      const slider = screen.getByRole('slider')

      fireEvent.keyDown(slider, { key: 'ArrowRight' })

      expect(slider).toHaveAttribute('aria-valuenow', '52')
    })

    it('jumps to start on Home', () => {
      render(<ComparisonSlider {...defaultProps} />)
      const slider = screen.getByRole('slider')

      fireEvent.keyDown(slider, { key: 'Home' })

      expect(slider).toHaveAttribute('aria-valuenow', '0')
    })

    it('jumps to end on End', () => {
      render(<ComparisonSlider {...defaultProps} />)
      const slider = screen.getByRole('slider')

      fireEvent.keyDown(slider, { key: 'End' })

      expect(slider).toHaveAttribute('aria-valuenow', '100')
    })

    it('moves by 10 with Shift+Arrow', () => {
      render(<ComparisonSlider {...defaultProps} />)
      const slider = screen.getByRole('slider')

      fireEvent.keyDown(slider, { key: 'ArrowRight', shiftKey: true })

      expect(slider).toHaveAttribute('aria-valuenow', '60')
    })
  })

  describe('accessibility', () => {
    it('has correct ARIA attributes', () => {
      render(<ComparisonSlider {...defaultProps} />)
      const slider = screen.getByRole('slider')

      expect(slider).toHaveAttribute('aria-valuemin', '0')
      expect(slider).toHaveAttribute('aria-valuemax', '100')
      expect(slider).toHaveAttribute('aria-label', 'Image comparison slider')
    })

    it('is keyboard focusable', () => {
      render(<ComparisonSlider {...defaultProps} />)
      const slider = screen.getByRole('slider')
      expect(slider).toHaveAttribute('tabIndex', '0')
    })
  })
})
