/**
 * Tests for Export Utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  generateFilename,
  isWebPSupported,
  isClipboardSupported,
  isShareSupported,
  getFormatDisplayName,
  getFormatDescription,
} from './export'

describe('export utilities', () => {
  describe('generateFilename', () => {
    it('returns default filename when original is null', () => {
      expect(generateFilename(null, 'png')).toBe('image-nobg.png')
      expect(generateFilename(null, 'webp')).toBe('image-nobg.webp')
    })

    it('adds -nobg suffix to original filename', () => {
      expect(generateFilename('photo.jpg', 'png')).toBe('photo-nobg.png')
      expect(generateFilename('portrait.png', 'webp')).toBe('portrait-nobg.webp')
    })

    it('removes original extension before adding suffix', () => {
      expect(generateFilename('image.jpeg', 'png')).toBe('image-nobg.png')
      expect(generateFilename('test.bmp', 'webp')).toBe('test-nobg.webp')
    })

    it('cleans special characters from filename', () => {
      // Spaces, parentheses, and special chars become dashes, then multiple dashes collapse
      expect(generateFilename('my photo (1).jpg', 'png')).toBe('my-photo-1--nobg.png')
      expect(generateFilename('image@2x.png', 'png')).toBe('image-2x-nobg.png')
    })

    it('handles filenames with multiple dots', () => {
      expect(generateFilename('my.photo.2024.jpg', 'png')).toBe('my-photo-2024-nobg.png')
    })

    it('preserves dashes and underscores', () => {
      expect(generateFilename('my-photo_2024.jpg', 'png')).toBe('my-photo_2024-nobg.png')
    })

    it('collapses multiple dashes', () => {
      expect(generateFilename('photo---test.jpg', 'png')).toBe('photo-test-nobg.png')
    })
  })

  describe('isWebPSupported', () => {
    it('returns false when document is undefined', () => {
      const originalDocument = global.document
      // @ts-expect-error - Testing undefined document
      delete global.document
      expect(isWebPSupported()).toBe(false)
      global.document = originalDocument
    })

    it('checks canvas toDataURL support', () => {
      // In jsdom, canvas might not fully support webp
      const result = isWebPSupported()
      expect(typeof result).toBe('boolean')
    })
  })

  describe('isClipboardSupported', () => {
    beforeEach(() => {
      // Reset navigator.clipboard
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        writable: true,
        configurable: true,
      })
    })

    it('returns false when navigator is undefined', () => {
      const originalNavigator = global.navigator
      // @ts-expect-error - Testing undefined navigator
      delete global.navigator
      expect(isClipboardSupported()).toBe(false)
      global.navigator = originalNavigator
    })

    it('returns false when clipboard API is not available', () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        configurable: true,
      })
      expect(isClipboardSupported()).toBe(false)
    })

    it('returns true when clipboard.write is available', () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: { write: vi.fn() },
        configurable: true,
      })
      expect(isClipboardSupported()).toBe(true)
    })
  })

  describe('isShareSupported', () => {
    it('returns false when navigator is undefined', () => {
      const originalNavigator = global.navigator
      // @ts-expect-error - Testing undefined navigator
      delete global.navigator
      expect(isShareSupported()).toBe(false)
      global.navigator = originalNavigator
    })

    it('returns a boolean value', () => {
      // In jsdom, navigator.share may or may not be defined
      // Just verify it returns a boolean
      const result = isShareSupported()
      expect(typeof result).toBe('boolean')
    })

    it('returns true when both share and canShare are in navigator', () => {
      // Save original values
      const originalShare = Object.getOwnPropertyDescriptor(navigator, 'share')
      const originalCanShare = Object.getOwnPropertyDescriptor(navigator, 'canShare')

      // Define both APIs
      Object.defineProperty(navigator, 'share', {
        value: vi.fn(),
        configurable: true,
      })
      Object.defineProperty(navigator, 'canShare', {
        value: vi.fn(),
        configurable: true,
      })

      expect(isShareSupported()).toBe(true)

      // Restore originals
      if (originalShare) {
        Object.defineProperty(navigator, 'share', originalShare)
      }
      if (originalCanShare) {
        Object.defineProperty(navigator, 'canShare', originalCanShare)
      }
    })
  })

  describe('getFormatDisplayName', () => {
    it('returns correct display name for PNG', () => {
      expect(getFormatDisplayName('png')).toBe('PNG (Lossless)')
    })

    it('returns correct display name for WebP', () => {
      expect(getFormatDisplayName('webp')).toBe('WebP (Smaller)')
    })
  })

  describe('getFormatDescription', () => {
    it('returns correct description for PNG', () => {
      expect(getFormatDescription('png')).toBe('Best quality, larger file size')
    })

    it('returns correct description for WebP', () => {
      expect(getFormatDescription('webp')).toBe('Good quality, smaller file size')
    })
  })
})
