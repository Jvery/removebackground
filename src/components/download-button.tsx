'use client'

/**
 * Download Button Component
 *
 * Provides download functionality with:
 * - Format selection (PNG/WebP)
 * - Quality slider for WebP
 * - Copy to clipboard
 * - Loading state during generation
 * - Premium visual design
 */

import { useState, useCallback } from 'react'
import {
  exportImage,
  downloadBlob,
  copyToClipboard,
  isClipboardSupported,
  isWebPSupported,
  generateFilename,
  type ExportFormat,
} from '@/lib/export'

interface DownloadButtonProps {
  blob: Blob | null
  originalFilename?: string | null
  disabled?: boolean
  className?: string
  onDownload?: () => void
  onCopy?: () => void
  onError?: (error: string) => void
}

export function DownloadButton({
  blob,
  originalFilename = null,
  disabled = false,
  className = '',
  onDownload,
  onCopy,
  onError,
}: DownloadButtonProps) {
  const [format, setFormat] = useState<ExportFormat>('png')
  const [quality, setQuality] = useState(95)
  const [isExporting, setIsExporting] = useState(false)
  const [isCopying, setIsCopying] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  const handleDownload = useCallback(async () => {
    if (!blob) return

    setIsExporting(true)
    try {
      const filename = generateFilename(originalFilename, format)
      const { blob: exportedBlob } = await exportImage(blob, {
        format,
        quality: quality / 100,
        filename,
      })
      downloadBlob(exportedBlob, filename)
      onDownload?.()
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Download failed')
    } finally {
      setIsExporting(false)
    }
  }, [blob, format, quality, originalFilename, onDownload, onError])

  const handleCopy = useCallback(async () => {
    if (!blob) return

    setIsCopying(true)
    setCopySuccess(false)
    try {
      await copyToClipboard(blob)
      setCopySuccess(true)
      onCopy?.()
      // Reset success state after 2 seconds
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Copy failed')
    } finally {
      setIsCopying(false)
    }
  }, [blob, onCopy, onError])

  const isDisabled = disabled || !blob
  const showWebP = isWebPSupported()
  const showCopyButton = isClipboardSupported()

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Main actions */}
      <div className="flex items-center gap-2">
        {/* Download button */}
        <button
          type="button"
          onClick={handleDownload}
          disabled={isDisabled || isExporting}
          aria-label={isExporting ? 'Exporting image' : `Download image as ${format.toUpperCase()}`}
          className={`
            btn-primary flex-1 flex items-center justify-center gap-2
            ${isDisabled || isExporting ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {isExporting ? (
            <>
              <svg
                className="w-5 h-5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <span>Exporting...</span>
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              <span>Download {format.toUpperCase()}</span>
            </>
          )}
        </button>

        {/* Copy to clipboard button */}
        {showCopyButton && (
          <button
            type="button"
            onClick={handleCopy}
            disabled={isDisabled || isCopying}
            className={`
              p-3 rounded-xl transition-all duration-200
              ${copySuccess
                ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20'
                : isDisabled || isCopying
                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : 'bg-muted text-foreground hover:bg-muted/80 border border-transparent'
              }
            `}
            title={copySuccess ? 'Copied!' : 'Copy to clipboard'}
            aria-label={copySuccess ? 'Copied!' : 'Copy to clipboard'}
          >
            {isCopying ? (
              <svg
                className="w-5 h-5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : copySuccess ? (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                />
              </svg>
            )}
          </button>
        )}

        {/* Options toggle */}
        <button
          type="button"
          onClick={() => setShowOptions(!showOptions)}
          className={`
            p-3 rounded-xl transition-all duration-200
            ${showOptions
              ? 'bg-primary/10 text-primary border border-primary/20'
              : 'bg-muted text-foreground hover:bg-muted/80 border border-transparent'
            }
          `}
          title="Export options"
          aria-label="Export options"
          aria-expanded={showOptions}
        >
          <svg
            className={`w-5 h-5 transition-transform duration-200 ${showOptions ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      </div>

      {/* Options panel */}
      {showOptions && (
        <div className="p-4 bg-card rounded-xl border border-border space-y-4 animate-scale-in">
          {/* Format selection */}
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">Format</label>
            <div className="flex gap-2">
              <FormatButton
                format="png"
                currentFormat={format}
                onClick={setFormat}
              />
              {showWebP && (
                <FormatButton
                  format="webp"
                  currentFormat={format}
                  onClick={setFormat}
                />
              )}
            </div>
          </div>

          {/* Quality slider (WebP only) */}
          {format === 'webp' && (
            <div>
              <label id="quality-label" className="block text-sm font-medium mb-2 text-foreground">
                Quality: <span className="text-primary">{quality}%</span>
              </label>
              <input
                type="range"
                min={50}
                max={100}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
                aria-labelledby="quality-label"
                aria-valuemin={50}
                aria-valuemax={100}
                aria-valuenow={quality}
                aria-valuetext={`${quality}% quality`}
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Smaller file</span>
                <span>Better quality</span>
              </div>
            </div>
          )}

          {/* Format info */}
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">
              {format === 'png'
                ? 'PNG: Lossless compression, best for graphics and logos. Full transparency support.'
                : 'WebP: Smaller file size with excellent quality. Great for web use.'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

interface FormatButtonProps {
  format: ExportFormat
  currentFormat: ExportFormat
  onClick: (format: ExportFormat) => void
}

function FormatButton({ format, currentFormat, onClick }: FormatButtonProps) {
  const isActive = format === currentFormat

  return (
    <button
      type="button"
      onClick={() => onClick(format)}
      className={`
        flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
        ${isActive
          ? 'bg-primary/10 text-primary border border-primary/20'
          : 'bg-muted text-muted-foreground hover:bg-muted/80 border border-transparent'
        }
      `}
      aria-pressed={isActive}
    >
      {format.toUpperCase()}
    </button>
  )
}

export default DownloadButton
