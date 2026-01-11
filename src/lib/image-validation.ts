/**
 * Image Validation Module
 *
 * Validates images via magic bytes (not just file extension) and checks
 * dimensions. This ensures only valid images are processed.
 *
 * Magic bytes provide reliable file type detection regardless of extension.
 */

// Magic bytes for supported image formats
const MAGIC_BYTES: Record<string, { bytes: number[]; mask?: number[] }[]> = {
  png: [{ bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }],
  jpeg: [
    { bytes: [0xff, 0xd8, 0xff, 0xe0] },
    { bytes: [0xff, 0xd8, 0xff, 0xe1] },
    { bytes: [0xff, 0xd8, 0xff, 0xe2] },
    { bytes: [0xff, 0xd8, 0xff, 0xe8] },
    { bytes: [0xff, 0xd8, 0xff, 0xdb] },
  ],
  webp: [
    {
      bytes: [0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50],
      mask: [0xff, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x00, 0xff, 0xff, 0xff, 0xff],
    },
  ],
  gif: [
    { bytes: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61] }, // GIF87a
    { bytes: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61] }, // GIF89a
  ],
}

export type SupportedImageFormat = 'png' | 'jpeg' | 'webp' | 'gif'

export interface ValidationResult {
  valid: boolean
  format?: SupportedImageFormat
  error?: string
}

export interface ImageDimensions {
  width: number
  height: number
}

export interface DetailedValidation extends ValidationResult {
  dimensions?: ImageDimensions
  fileSize: number
  warnings: string[]
}

// Constants for validation
const MIN_DIMENSION = 10
const MAX_DIMENSION = 8192
const LARGE_FILE_THRESHOLD = 20 * 1024 * 1024 // 20MB

/**
 * Read bytes from a file/blob (compatible with jsdom)
 */
async function readBytes(file: File | Blob, length: number): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(new Uint8Array(reader.result))
      } else {
        reject(new Error('Failed to read file'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file.slice(0, length))
  })
}

/**
 * Detect image format from magic bytes
 */
export async function detectImageFormat(
  file: File | Blob
): Promise<SupportedImageFormat | null> {
  const bytes = await readBytes(file, 12)

  for (const [format, signatures] of Object.entries(MAGIC_BYTES)) {
    for (const sig of signatures) {
      if (matchesSignature(bytes, sig.bytes, sig.mask)) {
        return format as SupportedImageFormat
      }
    }
  }

  return null
}

/**
 * Check if bytes match a signature with optional mask
 */
function matchesSignature(
  bytes: Uint8Array,
  signature: number[],
  mask?: number[]
): boolean {
  if (bytes.length < signature.length) return false

  for (let i = 0; i < signature.length; i++) {
    const maskByte = mask?.[i] ?? 0xff
    if ((bytes[i] & maskByte) !== (signature[i] & maskByte)) {
      return false
    }
  }

  return true
}

/**
 * Validate image file type via magic bytes
 */
export async function validateImageType(file: File | Blob): Promise<ValidationResult> {
  const format = await detectImageFormat(file)

  if (!format) {
    return {
      valid: false,
      error: 'Unsupported image format. Please use PNG, JPEG, WebP, or GIF.',
    }
  }

  return {
    valid: true,
    format,
  }
}

/**
 * Get image dimensions by loading it
 */
export function getImageDimensions(file: File | Blob): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image. The file may be corrupted.'))
    }

    img.src = url
  })
}

/**
 * Validate image dimensions
 */
export function validateDimensions(
  dimensions: ImageDimensions
): { valid: boolean; error?: string; warnings: string[] } {
  const warnings: string[] = []

  if (dimensions.width < MIN_DIMENSION || dimensions.height < MIN_DIMENSION) {
    return {
      valid: false,
      error: `Image is too small. Minimum dimensions are ${MIN_DIMENSION}x${MIN_DIMENSION} pixels.`,
      warnings,
    }
  }

  if (dimensions.width > MAX_DIMENSION || dimensions.height > MAX_DIMENSION) {
    warnings.push(
      `Image dimensions exceed ${MAX_DIMENSION}x${MAX_DIMENSION}. Processing may be slow.`
    )
  }

  return {
    valid: true,
    warnings,
  }
}

/**
 * Full image validation: type, dimensions, and file size warnings
 */
export async function validateImage(file: File | Blob): Promise<DetailedValidation> {
  const warnings: string[] = []
  const fileSize = file.size

  // Check file size warning
  if (fileSize > LARGE_FILE_THRESHOLD) {
    const sizeMB = (fileSize / (1024 * 1024)).toFixed(1)
    warnings.push(`Large file (${sizeMB}MB). Processing may take longer.`)
  }

  // Validate type via magic bytes
  const typeResult = await validateImageType(file)
  if (!typeResult.valid) {
    return {
      valid: false,
      error: typeResult.error,
      fileSize,
      warnings,
    }
  }

  // Get and validate dimensions
  try {
    const dimensions = await getImageDimensions(file)
    const dimResult = validateDimensions(dimensions)

    if (!dimResult.valid) {
      return {
        valid: false,
        error: dimResult.error,
        format: typeResult.format,
        dimensions,
        fileSize,
        warnings: [...warnings, ...dimResult.warnings],
      }
    }

    return {
      valid: true,
      format: typeResult.format,
      dimensions,
      fileSize,
      warnings: [...warnings, ...dimResult.warnings],
    }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Failed to validate image',
      format: typeResult.format,
      fileSize,
      warnings,
    }
  }
}

/**
 * Create a preview URL for an image file
 * Remember to revoke the URL when done using URL.revokeObjectURL()
 */
export function createPreviewUrl(file: File | Blob): string {
  return URL.createObjectURL(file)
}

/**
 * Get human-readable format name
 */
export function getFormatDisplayName(format: SupportedImageFormat): string {
  switch (format) {
    case 'png':
      return 'PNG'
    case 'jpeg':
      return 'JPEG'
    case 'webp':
      return 'WebP'
    case 'gif':
      return 'GIF'
  }
}

/**
 * Get MIME type for format
 */
export function getFormatMimeType(format: SupportedImageFormat): string {
  switch (format) {
    case 'png':
      return 'image/png'
    case 'jpeg':
      return 'image/jpeg'
    case 'webp':
      return 'image/webp'
    case 'gif':
      return 'image/gif'
  }
}
