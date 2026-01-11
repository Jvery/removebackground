/**
 * Tests for Download Button Component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DownloadButton } from './download-button'

// Mock the export utilities
vi.mock('@/lib/export', () => ({
  exportImage: vi.fn().mockResolvedValue({
    blob: new Blob(['test'], { type: 'image/png' }),
    filename: 'test-nobg.png',
  }),
  downloadBlob: vi.fn(),
  copyToClipboard: vi.fn().mockResolvedValue(undefined),
  isClipboardSupported: vi.fn().mockReturnValue(true),
  isWebPSupported: vi.fn().mockReturnValue(true),
  generateFilename: vi.fn().mockReturnValue('test-nobg.png'),
}))

describe('DownloadButton', () => {
  const mockBlob = new Blob(['test'], { type: 'image/png' })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders download button', () => {
      render(<DownloadButton blob={mockBlob} />)
      expect(screen.getByText('Download PNG')).toBeInTheDocument()
    })

    it('renders copy to clipboard button when supported', () => {
      render(<DownloadButton blob={mockBlob} />)
      expect(screen.getByTitle('Copy to clipboard')).toBeInTheDocument()
    })

    it('renders options toggle button', () => {
      render(<DownloadButton blob={mockBlob} />)
      expect(screen.getByTitle('Export options')).toBeInTheDocument()
    })

    it('disables button when blob is null', () => {
      render(<DownloadButton blob={null} />)
      const downloadButton = screen.getByText('Download PNG')
      expect(downloadButton.closest('button')).toBeDisabled()
    })

    it('disables button when disabled prop is true', () => {
      render(<DownloadButton blob={mockBlob} disabled />)
      const downloadButton = screen.getByText('Download PNG')
      expect(downloadButton.closest('button')).toBeDisabled()
    })

    it('applies custom className', () => {
      const { container } = render(
        <DownloadButton blob={mockBlob} className="custom-class" />
      )
      expect(container.firstChild).toHaveClass('custom-class')
    })
  })

  describe('options panel', () => {
    it('is hidden by default', () => {
      render(<DownloadButton blob={mockBlob} />)
      expect(screen.queryByText('Format')).not.toBeInTheDocument()
    })

    it('shows options when toggle is clicked', () => {
      render(<DownloadButton blob={mockBlob} />)
      const optionsButton = screen.getByTitle('Export options')

      fireEvent.click(optionsButton)

      expect(screen.getByText('Format')).toBeInTheDocument()
    })

    it('hides options when toggle is clicked again', () => {
      render(<DownloadButton blob={mockBlob} />)
      const optionsButton = screen.getByTitle('Export options')

      fireEvent.click(optionsButton)
      expect(screen.getByText('Format')).toBeInTheDocument()

      fireEvent.click(optionsButton)
      expect(screen.queryByText('Format')).not.toBeInTheDocument()
    })

    it('shows format buttons when options are open', () => {
      render(<DownloadButton blob={mockBlob} />)
      const optionsButton = screen.getByTitle('Export options')

      fireEvent.click(optionsButton)

      expect(screen.getByRole('button', { name: 'PNG' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'WEBP' })).toBeInTheDocument()
    })

    it('shows quality slider when WebP is selected', () => {
      render(<DownloadButton blob={mockBlob} />)
      const optionsButton = screen.getByTitle('Export options')
      fireEvent.click(optionsButton)

      const webpButton = screen.getByRole('button', { name: 'WEBP' })
      fireEvent.click(webpButton)

      expect(screen.getByText(/Quality:/)).toBeInTheDocument()
    })

    it('hides quality slider when PNG is selected', () => {
      render(<DownloadButton blob={mockBlob} />)
      const optionsButton = screen.getByTitle('Export options')
      fireEvent.click(optionsButton)

      // Switch to WebP first
      const webpButton = screen.getByRole('button', { name: 'WEBP' })
      fireEvent.click(webpButton)
      expect(screen.getByText(/Quality:/)).toBeInTheDocument()

      // Switch back to PNG
      const pngButton = screen.getByRole('button', { name: 'PNG' })
      fireEvent.click(pngButton)
      expect(screen.queryByText(/Quality:/)).not.toBeInTheDocument()
    })
  })

  describe('format selection', () => {
    it('defaults to PNG format', () => {
      render(<DownloadButton blob={mockBlob} />)
      expect(screen.getByText('Download PNG')).toBeInTheDocument()
    })

    it('updates download button text when format changes', () => {
      render(<DownloadButton blob={mockBlob} />)

      // Open options
      const optionsButton = screen.getByTitle('Export options')
      fireEvent.click(optionsButton)

      // Select WebP
      const webpButton = screen.getByRole('button', { name: 'WEBP' })
      fireEvent.click(webpButton)

      expect(screen.getByText('Download WEBP')).toBeInTheDocument()
    })

    it('sets aria-pressed correctly on format buttons', () => {
      render(<DownloadButton blob={mockBlob} />)

      // Open options
      const optionsButton = screen.getByTitle('Export options')
      fireEvent.click(optionsButton)

      const pngButton = screen.getByRole('button', { name: 'PNG' })
      const webpButton = screen.getByRole('button', { name: 'WEBP' })

      expect(pngButton).toHaveAttribute('aria-pressed', 'true')
      expect(webpButton).toHaveAttribute('aria-pressed', 'false')

      fireEvent.click(webpButton)

      expect(pngButton).toHaveAttribute('aria-pressed', 'false')
      expect(webpButton).toHaveAttribute('aria-pressed', 'true')
    })
  })

  describe('download functionality', () => {
    it('calls onDownload callback on successful download', async () => {
      const onDownload = vi.fn()
      render(<DownloadButton blob={mockBlob} onDownload={onDownload} />)

      const downloadButton = screen.getByText('Download PNG').closest('button')!
      fireEvent.click(downloadButton)

      await waitFor(() => {
        expect(onDownload).toHaveBeenCalled()
      })
    })

    it('shows loading state during export', async () => {
      const { exportImage } = await import('@/lib/export')
      vi.mocked(exportImage).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      )

      render(<DownloadButton blob={mockBlob} />)

      const downloadButton = screen.getByText('Download PNG').closest('button')!
      fireEvent.click(downloadButton)

      expect(screen.getByText('Exporting...')).toBeInTheDocument()
    })
  })

  describe('copy functionality', () => {
    it('calls onCopy callback on successful copy', async () => {
      const onCopy = vi.fn()
      render(<DownloadButton blob={mockBlob} onCopy={onCopy} />)

      const copyButton = screen.getByTitle('Copy to clipboard')
      fireEvent.click(copyButton)

      await waitFor(() => {
        expect(onCopy).toHaveBeenCalled()
      })
    })

    it('calls onError when copy fails', async () => {
      const { copyToClipboard } = await import('@/lib/export')
      vi.mocked(copyToClipboard).mockRejectedValue(new Error('Copy failed'))

      const onError = vi.fn()
      render(<DownloadButton blob={mockBlob} onError={onError} />)

      const copyButton = screen.getByTitle('Copy to clipboard')
      fireEvent.click(copyButton)

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Copy failed')
      })
    })
  })

  describe('accessibility', () => {
    it('has accessible name for copy button', () => {
      render(<DownloadButton blob={mockBlob} />)
      expect(screen.getByLabelText('Copy to clipboard')).toBeInTheDocument()
    })

    it('has accessible name for options button', () => {
      render(<DownloadButton blob={mockBlob} />)
      expect(screen.getByLabelText('Export options')).toBeInTheDocument()
    })

    it('has aria-expanded on options button', () => {
      render(<DownloadButton blob={mockBlob} />)
      const optionsButton = screen.getByTitle('Export options')

      expect(optionsButton).toHaveAttribute('aria-expanded', 'false')

      fireEvent.click(optionsButton)

      expect(optionsButton).toHaveAttribute('aria-expanded', 'true')
    })
  })
})
