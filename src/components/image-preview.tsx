'use client'

/**
 * Image Preview Container Component
 *
 * Displays original and processed images with multiple view modes:
 * - Slider comparison (default)
 * - Side-by-side view
 * - Processed only view
 *
 * Features:
 * - Responsive sizing (larger on bigger screens)
 * - Natural aspect ratio preservation
 * - No hydration errors (localStorage read in useEffect)
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
  // Start with default, then hydrate from localStorage after mount
  const [viewMode, setViewMode] = useState<ViewMode>(defaultViewMode)
  const [isHydrated, setIsHydrated] = useState(false)

  // Hydrate view mode from localStorage after mount (avoids hydration mismatch)
  useEffect(() => {
    const saved = localStorage.getItem(VIEW_MODE_KEY)
    if (saved === 'slider' || saved === 'side-by-side' || saved === 'processed') {
      setViewMode(saved)
    }
    setIsHydrated(true)
  }, [])

  // Persist view mode to localStorage
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(VIEW_MODE_KEY, viewMode)
    }
  }, [viewMode, isHydrated])

  // Keyboard shortcut for quick toggle (Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      if (e.code === 'Space') {
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
        <div className="w-full max-h-[70vh] lg:max-h-[75vh] xl:max-h-[80vh] flex items-center justify-center bg-muted/30 rounded-xl overflow-hidden">
          <img
            src={originalUrl}
            alt="Original image"
            className="max-w-full max-h-[70vh] lg:max-h-[75vh] xl:max-h-[80vh] w-auto h-auto object-contain"
          />
        </div>
        {isProcessing && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center rounded-xl">
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

      {/* Preview content - responsive sizing */}
      <div className="flex-1 min-h-0 w-full">
        {viewMode === 'slider' && (
          <div className="w-full flex justify-center">
            <ComparisonSlider
              originalSrc={originalUrl}
              processedSrc={processedUrl}
              className="w-full max-w-full rounded-xl shadow-lg max-h-[60vh] lg:max-h-[65vh] xl:max-h-[70vh]"
            />
          </div>
        )}

        {viewMode === 'side-by-side' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative flex items-center justify-center bg-muted/30 rounded-xl overflow-hidden min-h-[200px] max-h-[50vh] lg:max-h-[60vh] xl:max-h-[65vh]">
              <p className="absolute top-3 left-3 z-10 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full text-xs font-medium text-white">
                Original
              </p>
              <img
                src={originalUrl}
                alt="Original image"
                className="max-w-full max-h-full w-auto h-auto object-contain"
              />
            </div>
            <div className="relative flex items-center justify-center checkerboard rounded-xl overflow-hidden min-h-[200px] max-h-[50vh] lg:max-h-[60vh] xl:max-h-[65vh]">
              <p className="absolute top-3 left-3 z-10 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full text-xs font-medium text-white">
                Processed
              </p>
              <img
                src={processedUrl}
                alt="Processed image"
                className="max-w-full max-h-full w-auto h-auto object-contain"
              />
            </div>
          </div>
        )}

        {viewMode === 'processed' && (
          <div className="w-full flex justify-center">
            <div className="relative checkerboard rounded-xl overflow-hidden max-h-[60vh] lg:max-h-[65vh] xl:max-h-[70vh] inline-flex items-center justify-center">
              <img
                src={processedUrl}
                alt="Processed image with transparent background"
                className="max-w-full max-h-[60vh] lg:max-h-[65vh] xl:max-h-[70vh] w-auto h-auto object-contain"
              />
            </div>
          </div>
        )}
      </div>

      {/* Keyboard hint */}
      <p className="text-center text-xs text-muted-foreground">
        Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-foreground font-mono">Space</kbd> to toggle view
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
        px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
        ${isActive
          ? 'bg-primary text-primary-foreground shadow-md'
          : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
        }
      `}
      aria-pressed={isActive}
    >
      {label}
    </button>
  )
}

export default ImagePreview
