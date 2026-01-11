'use client'

/**
 * Image Preview Container Component
 *
 * Displays original and processed images with multiple view modes:
 * - Slider comparison (default)
 * - Side-by-side view
 * - Processed only view
 *
 * Integrates ZoomableImage and ComparisonSlider components.
 */

import { useState, useCallback, useEffect } from 'react'
import { ZoomableImage } from './zoomable-image'
import { ComparisonSlider } from './comparison-slider'

export type ViewMode = 'slider' | 'side-by-side' | 'processed'

interface ImagePreviewProps {
  originalUrl: string
  processedUrl: string | null
  isProcessing?: boolean
  progress?: number
  className?: string
  defaultViewMode?: ViewMode
}

const VIEW_MODE_KEY = 'removebackground-view-mode'

export function ImagePreview({
  originalUrl,
  processedUrl,
  isProcessing = false,
  progress = 0,
  className = '',
  defaultViewMode = 'slider',
}: ImagePreviewProps) {
  // Load saved view mode from localStorage
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === 'undefined') return defaultViewMode
    const saved = localStorage.getItem(VIEW_MODE_KEY)
    if (saved === 'slider' || saved === 'side-by-side' || saved === 'processed') {
      return saved
    }
    return defaultViewMode
  })

  // Persist view mode to localStorage
  useEffect(() => {
    localStorage.setItem(VIEW_MODE_KEY, viewMode)
  }, [viewMode])

  // Keyboard shortcut for quick toggle (Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.target?.toString().includes('Input')) {
        e.preventDefault()
        setViewMode((prev) => prev === 'slider' ? 'processed' : 'slider')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode)
  }, [])

  // If still processing, show original with overlay
  if (isProcessing || !processedUrl) {
    return (
      <div className={`relative ${className}`}>
        <ZoomableImage
          src={originalUrl}
          alt="Original image"
          className="w-full aspect-video"
        />
        {isProcessing && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm font-medium">Processing... {Math.round(progress * 100)}%</p>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* View mode selector */}
      <div className="flex items-center justify-center gap-2">
        <ViewModeButton
          mode="slider"
          currentMode={viewMode}
          onClick={handleViewModeChange}
          label="Slider"
        />
        <ViewModeButton
          mode="side-by-side"
          currentMode={viewMode}
          onClick={handleViewModeChange}
          label="Side by Side"
        />
        <ViewModeButton
          mode="processed"
          currentMode={viewMode}
          onClick={handleViewModeChange}
          label="Result Only"
        />
      </div>

      {/* Preview content */}
      <div className="flex-1 min-h-0">
        {viewMode === 'slider' && (
          <ComparisonSlider
            originalSrc={originalUrl}
            processedSrc={processedUrl}
            className="w-full aspect-video rounded-lg"
          />
        )}

        {viewMode === 'side-by-side' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <p className="absolute top-2 left-2 z-10 px-2 py-1 bg-background/80 backdrop-blur-sm rounded text-xs font-medium">
                Original
              </p>
              <ZoomableImage
                src={originalUrl}
                alt="Original image"
                className="w-full aspect-video rounded-lg"
              />
            </div>
            <div className="relative">
              <p className="absolute top-2 left-2 z-10 px-2 py-1 bg-background/80 backdrop-blur-sm rounded text-xs font-medium">
                Processed
              </p>
              <ZoomableImage
                src={processedUrl}
                alt="Processed image"
                showCheckerboard
                className="w-full aspect-video rounded-lg"
              />
            </div>
          </div>
        )}

        {viewMode === 'processed' && (
          <ZoomableImage
            src={processedUrl}
            alt="Processed image with transparent background"
            showCheckerboard
            className="w-full aspect-video rounded-lg"
          />
        )}
      </div>

      {/* Keyboard hint */}
      <p className="text-center text-xs text-muted-foreground">
        Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-foreground">Space</kbd> to toggle view
      </p>
    </div>
  )
}

interface ViewModeButtonProps {
  mode: ViewMode
  currentMode: ViewMode
  onClick: (mode: ViewMode) => void
  label: string
}

function ViewModeButton({ mode, currentMode, onClick, label }: ViewModeButtonProps) {
  const isActive = mode === currentMode

  return (
    <button
      type="button"
      onClick={() => onClick(mode)}
      className={`
        px-4 py-2 text-sm font-medium rounded-lg transition-colors
        ${isActive
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground hover:bg-muted/80'
        }
      `}
      aria-pressed={isActive}
    >
      {label}
    </button>
  )
}

export default ImagePreview
