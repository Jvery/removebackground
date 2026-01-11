/**
 * Tests for Image Preview Component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ImagePreview, type ViewMode } from './image-preview'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('ImagePreview', () => {
  const defaultProps = {
    originalUrl: 'original.png',
    processedUrl: 'processed.png',
  }

  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders view mode buttons', () => {
      render(<ImagePreview {...defaultProps} />)
      expect(screen.getByText('Slider')).toBeInTheDocument()
      expect(screen.getByText('Side by Side')).toBeInTheDocument()
      expect(screen.getByText('Result Only')).toBeInTheDocument()
    })

    it('shows processing state when isProcessing is true', () => {
      render(
        <ImagePreview
          originalUrl="original.png"
          processedUrl={null}
          isProcessing
          progress={0.5}
        />
      )
      expect(screen.getByText('Processing... 50%')).toBeInTheDocument()
    })

    it('shows keyboard hint', () => {
      render(<ImagePreview {...defaultProps} />)
      expect(screen.getByText('Space')).toBeInTheDocument()
    })
  })

  describe('view modes', () => {
    it('defaults to slider mode', () => {
      render(<ImagePreview {...defaultProps} />)
      const sliderButton = screen.getByText('Slider')
      expect(sliderButton).toHaveAttribute('aria-pressed', 'true')
    })

    it('changes to side-by-side mode when clicked', () => {
      render(<ImagePreview {...defaultProps} />)
      const sideBySideButton = screen.getByText('Side by Side')

      fireEvent.click(sideBySideButton)

      expect(sideBySideButton).toHaveAttribute('aria-pressed', 'true')
    })

    it('changes to result only mode when clicked', () => {
      render(<ImagePreview {...defaultProps} />)
      const resultButton = screen.getByText('Result Only')

      fireEvent.click(resultButton)

      expect(resultButton).toHaveAttribute('aria-pressed', 'true')
    })

    it('persists view mode to localStorage', () => {
      render(<ImagePreview {...defaultProps} />)
      const sideBySideButton = screen.getByText('Side by Side')

      fireEvent.click(sideBySideButton)

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'removebackground-view-mode',
        'side-by-side'
      )
    })

    it('loads view mode from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('processed')
      render(<ImagePreview {...defaultProps} />)

      const resultButton = screen.getByText('Result Only')
      expect(resultButton).toHaveAttribute('aria-pressed', 'true')
    })
  })

  describe('keyboard shortcuts', () => {
    it('has keyboard hint displayed', () => {
      render(<ImagePreview {...defaultProps} />)
      // Verify the keyboard hint is shown
      expect(screen.getByText('Space')).toBeInTheDocument()
      expect(screen.getByText(/toggle view/i)).toBeInTheDocument()
    })
  })

  describe('without processed image', () => {
    it('shows original image only when processedUrl is null', () => {
      render(
        <ImagePreview
          originalUrl="original.png"
          processedUrl={null}
        />
      )
      // Should not show view mode buttons
      expect(screen.queryByText('Slider')).not.toBeInTheDocument()
    })
  })
})
