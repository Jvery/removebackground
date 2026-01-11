'use client'

/**
 * Zoomable Image Component
 *
 * Provides zoom and pan functionality for image preview:
 * - Mouse wheel zoom (centered on cursor)
 * - Click and drag to pan
 * - Double-click to reset
 * - Pinch-to-zoom on touch
 * - Zoom limits: 0.5x to 4x
 */

import {
  useRef,
  useState,
  useCallback,
  useEffect,
  type MouseEvent,
  type WheelEvent,
  type TouchEvent,
} from 'react'

interface ZoomableImageProps {
  src: string
  alt: string
  showCheckerboard?: boolean
  className?: string
  onZoomChange?: (zoom: number) => void
}

interface Transform {
  scale: number
  x: number
  y: number
}

const MIN_ZOOM = 0.5
const MAX_ZOOM = 4
const ZOOM_STEP = 0.1

export function ZoomableImage({
  src,
  alt,
  showCheckerboard = false,
  className = '',
  onZoomChange,
}: ZoomableImageProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [transform, setTransform] = useState<Transform>({ scale: 1, x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const lastTouchDistanceRef = useRef<number | null>(null)

  // Reset transform when image changes
  useEffect(() => {
    setTransform({ scale: 1, x: 0, y: 0 })
  }, [src])

  // Notify parent of zoom changes
  useEffect(() => {
    onZoomChange?.(transform.scale)
  }, [transform.scale, onZoomChange])

  // Handle mouse wheel zoom
  const handleWheel = useCallback((e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault()
    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    setTransform((prev) => {
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
      const newScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev.scale + delta))

      // Zoom toward mouse position
      const scaleRatio = newScale / prev.scale
      const newX = mouseX - (mouseX - prev.x) * scaleRatio
      const newY = mouseY - (mouseY - prev.y) * scaleRatio

      return { scale: newScale, x: newX, y: newY }
    })
  }, [])

  // Handle mouse down for drag
  const handleMouseDown = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return // Only left click
    e.preventDefault()
    setIsDragging(true)
    dragStartRef.current = {
      x: e.clientX - transform.x,
      y: e.clientY - transform.y,
    }
  }, [transform])

  // Handle mouse move for drag
  const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return
    setTransform((prev) => ({
      ...prev,
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    }))
  }, [isDragging])

  // Handle mouse up to end drag
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Handle double click to reset
  const handleDoubleClick = useCallback(() => {
    setTransform({ scale: 1, x: 0, y: 0 })
  }, [])

  // Handle touch start for pinch-to-zoom
  const handleTouchStart = useCallback((e: TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const distance = getTouchDistance(e.touches)
      lastTouchDistanceRef.current = distance
    } else if (e.touches.length === 1) {
      setIsDragging(true)
      dragStartRef.current = {
        x: e.touches[0].clientX - transform.x,
        y: e.touches[0].clientY - transform.y,
      }
    }
  }, [transform])

  // Handle touch move for pinch-to-zoom and pan
  const handleTouchMove = useCallback((e: TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && lastTouchDistanceRef.current !== null) {
      e.preventDefault()
      const distance = getTouchDistance(e.touches)
      const delta = (distance - lastTouchDistanceRef.current) / 100

      setTransform((prev) => {
        const newScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev.scale + delta))
        return { ...prev, scale: newScale }
      })

      lastTouchDistanceRef.current = distance
    } else if (e.touches.length === 1 && isDragging) {
      setTransform((prev) => ({
        ...prev,
        x: e.touches[0].clientX - dragStartRef.current.x,
        y: e.touches[0].clientY - dragStartRef.current.y,
      }))
    }
  }, [isDragging])

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
    lastTouchDistanceRef.current = null
  }, [])

  // Handle global mouse up to catch drag end outside container
  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false)
    window.addEventListener('mouseup', handleGlobalMouseUp)
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [])

  return (
    <div
      ref={containerRef}
      className={`
        relative overflow-hidden select-none
        ${showCheckerboard ? 'checkerboard' : 'bg-muted'}
        ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
        ${className}
      `}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      role="img"
      aria-label={alt}
      tabIndex={0}
    >
      <img
        src={src}
        alt={alt}
        className="max-w-none pointer-events-none"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: '0 0',
          transition: isDragging ? 'none' : 'transform 0.1s ease-out',
        }}
        draggable={false}
      />

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2 text-sm">
        <button
          type="button"
          onClick={() => setTransform((prev) => ({
            ...prev,
            scale: Math.max(MIN_ZOOM, prev.scale - ZOOM_STEP * 2),
          }))}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-muted transition-colors"
          aria-label="Zoom out"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <span className="w-12 text-center font-medium">
          {Math.round(transform.scale * 100)}%
        </span>
        <button
          type="button"
          onClick={() => setTransform((prev) => ({
            ...prev,
            scale: Math.min(MAX_ZOOM, prev.scale + ZOOM_STEP * 2),
          }))}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-muted transition-colors"
          aria-label="Zoom in"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button
          type="button"
          onClick={handleDoubleClick}
          className="ml-2 w-8 h-8 flex items-center justify-center rounded hover:bg-muted transition-colors"
          aria-label="Reset zoom"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function getTouchDistance(touches: React.TouchList): number {
  const dx = touches[0].clientX - touches[1].clientX
  const dy = touches[0].clientY - touches[1].clientY
  return Math.sqrt(dx * dx + dy * dy)
}

export default ZoomableImage
