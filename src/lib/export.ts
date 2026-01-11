/**
 * Export Utilities
 *
 * Handles exporting processed images in various formats:
 * - PNG (lossless with alpha)
 * - WebP (smaller file size)
 * - Copy to clipboard
 *
 * All operations happen client-side.
 */

export type ExportFormat = 'png' | 'webp'

export interface ExportOptions {
  format?: ExportFormat
  quality?: number // 0-1 for WebP, ignored for PNG
  filename?: string
}

/**
 * Generate a download filename
 * Pattern: {original-name}-nobg.{ext}
 */
export function generateFilename(
  originalFilename: string | null,
  format: ExportFormat
): string {
  const ext = format === 'webp' ? 'webp' : 'png'

  if (!originalFilename) {
    return `image-nobg.${ext}`
  }

  // Remove extension from original filename
  const baseName = originalFilename.replace(/\.[^/.]+$/, '')

  // Clean filename (remove special characters except dashes and underscores)
  const cleanName = baseName.replace(/[^a-zA-Z0-9-_]/g, '-').replace(/-+/g, '-')

  return `${cleanName}-nobg.${ext}`
}

/**
 * Convert a Blob to a different format using Canvas
 */
export async function convertBlobFormat(
  blob: Blob,
  format: ExportFormat,
  quality: number = 0.95
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(blob)

    img.onload = () => {
      URL.revokeObjectURL(url)

      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to create canvas context'))
        return
      }

      // Draw image
      ctx.drawImage(img, 0, 0)

      // Convert to target format
      const mimeType = format === 'webp' ? 'image/webp' : 'image/png'
      canvas.toBlob(
        (newBlob) => {
          if (newBlob) {
            resolve(newBlob)
          } else {
            reject(new Error(`Failed to convert to ${format.toUpperCase()}`))
          }
        },
        mimeType,
        format === 'webp' ? quality : undefined
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image for conversion'))
    }

    img.src = url
  })
}

/**
 * Check if WebP export is supported
 */
export function isWebPSupported(): boolean {
  if (typeof document === 'undefined') return false

  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1

  const dataUrl = canvas.toDataURL('image/webp')
  return dataUrl?.startsWith('data:image/webp') ?? false
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename

  // Append to body to ensure click works in Firefox
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Revoke URL after a short delay to ensure download starts
  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 100)
}

/**
 * Export image with options
 */
export async function exportImage(
  blob: Blob,
  options: ExportOptions = {}
): Promise<{ blob: Blob; filename: string }> {
  const { format = 'png', quality = 0.95, filename } = options

  // If requesting WebP but it's not supported, fall back to PNG
  const actualFormat = format === 'webp' && !isWebPSupported() ? 'png' : format

  // Convert if necessary
  let outputBlob = blob

  // Check if we need to convert (blob might already be in target format)
  const needsConversion =
    (actualFormat === 'png' && blob.type !== 'image/png') ||
    (actualFormat === 'webp' && blob.type !== 'image/webp')

  if (needsConversion) {
    outputBlob = await convertBlobFormat(blob, actualFormat, quality)
  }

  const outputFilename = filename || generateFilename(null, actualFormat)

  return {
    blob: outputBlob,
    filename: outputFilename,
  }
}

/**
 * Check if Clipboard API is supported for images
 */
export function isClipboardSupported(): boolean {
  if (typeof navigator === 'undefined') return false
  return !!(navigator.clipboard && navigator.clipboard.write)
}

/**
 * Copy image to clipboard
 */
export async function copyToClipboard(blob: Blob): Promise<void> {
  if (!isClipboardSupported()) {
    throw new Error('Clipboard API is not supported in this browser')
  }

  // Clipboard API requires PNG format
  let pngBlob = blob
  if (blob.type !== 'image/png') {
    pngBlob = await convertBlobFormat(blob, 'png')
  }

  try {
    const clipboardItem = new ClipboardItem({
      'image/png': pngBlob,
    })
    await navigator.clipboard.write([clipboardItem])
  } catch (error) {
    throw new Error('Failed to copy image to clipboard')
  }
}

/**
 * Check if Web Share API is supported
 */
export function isShareSupported(): boolean {
  if (typeof navigator === 'undefined') return false
  return 'share' in navigator && 'canShare' in navigator
}

/**
 * Share image using Web Share API
 */
export async function shareImage(
  blob: Blob,
  filename: string
): Promise<void> {
  if (!isShareSupported()) {
    throw new Error('Web Share API is not supported in this browser')
  }

  const file = new File([blob], filename, { type: blob.type })

  if (!navigator.canShare({ files: [file] })) {
    throw new Error('Sharing files is not supported')
  }

  await navigator.share({
    files: [file],
    title: 'Background Removed Image',
  })
}

/**
 * Get export format display name
 */
export function getFormatDisplayName(format: ExportFormat): string {
  switch (format) {
    case 'png':
      return 'PNG (Lossless)'
    case 'webp':
      return 'WebP (Smaller)'
  }
}

/**
 * Get export format description
 */
export function getFormatDescription(format: ExportFormat): string {
  switch (format) {
    case 'png':
      return 'Best quality, larger file size'
    case 'webp':
      return 'Good quality, smaller file size'
  }
}
