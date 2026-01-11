/**
 * Tests for Image Validation Module
 *
 * Tests magic byte detection, dimension validation, and file size warnings.
 */

import { describe, it, expect } from 'vitest'
import {
  detectImageFormat,
  validateImageType,
  validateDimensions,
  getFormatDisplayName,
  getFormatMimeType,
  type SupportedImageFormat,
} from './image-validation'

// Helper to create a Blob with specific bytes
function createBlobWithBytes(bytes: number[]): Blob {
  return new Blob([new Uint8Array(bytes)])
}

describe('image-validation', () => {
  describe('detectImageFormat', () => {
    it('detects PNG format', async () => {
      // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
      const pngBlob = createBlobWithBytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
      const format = await detectImageFormat(pngBlob)
      expect(format).toBe('png')
    })

    it('detects JPEG format (E0 variant)', async () => {
      // JPEG magic bytes: FF D8 FF E0
      const jpegBlob = createBlobWithBytes([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10])
      const format = await detectImageFormat(jpegBlob)
      expect(format).toBe('jpeg')
    })

    it('detects JPEG format (E1 variant - EXIF)', async () => {
      // JPEG with EXIF: FF D8 FF E1
      const jpegBlob = createBlobWithBytes([0xff, 0xd8, 0xff, 0xe1, 0x00, 0x10])
      const format = await detectImageFormat(jpegBlob)
      expect(format).toBe('jpeg')
    })

    it('detects GIF87a format', async () => {
      // GIF87a magic bytes: 47 49 46 38 37 61
      const gifBlob = createBlobWithBytes([0x47, 0x49, 0x46, 0x38, 0x37, 0x61])
      const format = await detectImageFormat(gifBlob)
      expect(format).toBe('gif')
    })

    it('detects GIF89a format', async () => {
      // GIF89a magic bytes: 47 49 46 38 39 61
      const gifBlob = createBlobWithBytes([0x47, 0x49, 0x46, 0x38, 0x39, 0x61])
      const format = await detectImageFormat(gifBlob)
      expect(format).toBe('gif')
    })

    it('detects WebP format', async () => {
      // WebP magic bytes: RIFF....WEBP
      const webpBlob = createBlobWithBytes([
        0x52, 0x49, 0x46, 0x46, // RIFF
        0x00, 0x00, 0x00, 0x00, // file size (placeholder)
        0x57, 0x45, 0x42, 0x50, // WEBP
      ])
      const format = await detectImageFormat(webpBlob)
      expect(format).toBe('webp')
    })

    it('returns null for unsupported format', async () => {
      // Random bytes that don't match any format
      const unknownBlob = createBlobWithBytes([0x00, 0x01, 0x02, 0x03])
      const format = await detectImageFormat(unknownBlob)
      expect(format).toBeNull()
    })

    it('returns null for empty file', async () => {
      const emptyBlob = createBlobWithBytes([])
      const format = await detectImageFormat(emptyBlob)
      expect(format).toBeNull()
    })
  })

  describe('validateImageType', () => {
    it('validates PNG as valid', async () => {
      const pngBlob = createBlobWithBytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
      const result = await validateImageType(pngBlob)
      expect(result.valid).toBe(true)
      expect(result.format).toBe('png')
    })

    it('returns error for unsupported format', async () => {
      const unknownBlob = createBlobWithBytes([0x00, 0x01, 0x02, 0x03])
      const result = await validateImageType(unknownBlob)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Unsupported')
    })
  })

  describe('validateDimensions', () => {
    it('validates normal dimensions', () => {
      const result = validateDimensions({ width: 1920, height: 1080 })
      expect(result.valid).toBe(true)
      expect(result.warnings).toHaveLength(0)
    })

    it('rejects too small dimensions', () => {
      const result = validateDimensions({ width: 5, height: 5 })
      expect(result.valid).toBe(false)
      expect(result.error).toContain('too small')
    })

    it('warns for very large dimensions', () => {
      const result = validateDimensions({ width: 10000, height: 10000 })
      expect(result.valid).toBe(true)
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings[0]).toContain('8192')
    })

    it('accepts boundary dimensions', () => {
      const minResult = validateDimensions({ width: 10, height: 10 })
      expect(minResult.valid).toBe(true)

      const maxResult = validateDimensions({ width: 8192, height: 8192 })
      expect(maxResult.valid).toBe(true)
      expect(maxResult.warnings).toHaveLength(0)
    })
  })

  describe('getFormatDisplayName', () => {
    it('returns correct display names', () => {
      expect(getFormatDisplayName('png')).toBe('PNG')
      expect(getFormatDisplayName('jpeg')).toBe('JPEG')
      expect(getFormatDisplayName('webp')).toBe('WebP')
      expect(getFormatDisplayName('gif')).toBe('GIF')
    })
  })

  describe('getFormatMimeType', () => {
    it('returns correct MIME types', () => {
      expect(getFormatMimeType('png')).toBe('image/png')
      expect(getFormatMimeType('jpeg')).toBe('image/jpeg')
      expect(getFormatMimeType('webp')).toBe('image/webp')
      expect(getFormatMimeType('gif')).toBe('image/gif')
    })
  })
})
