'use client'

/**
 * Comparison Slider Component
 *
 * Draggable vertical divider to compare original and processed images:
 * - Left side shows original image
 * - Right side shows processed image on checkerboard
 * - Smooth, responsive dragging
 * - Touch support
 * - Keyboard accessible
 */

import {
  useRef,
  useState,
  useCallback,
  useEffect,
  type MouseEvent,
  type TouchEvent,
  type KeyboardEvent,
} from 'react'

interface ComparisonSliderProps {
  originalSrc: string
  processedSrc: string
  alt?: string
  initialPosition?: number
  className?: string
}

export function ComparisonSlider({
  originalSrc,
  processedSrc,
  alt = 'Image comparison',
  initialPosition = 50,
  className = '',
}: ComparisonSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState(initialPosition)
  const [isDragging, setIsDragging] = useState(false)

  // Calculate position from client X
  const calculatePosition = useCallback((clientX: number) => {
    const container = containerRef.current
    if (!container) return position

    const rect = container.getBoundingClientRect()
    const x = clientX - rect.left
    const percentage = (x / rect.width) * 100
    return Math.min(100, Math.max(0, percentage))
  }, [position])

  // Handle mouse down on slider
  const handleMouseDown = useCallback((e: MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    setPosition(calculatePosition(e.clientX))
  }, [calculatePosition])

  // Handle mouse move
  const handleMouseMove = useCallback((e: globalThis.MouseEvent) => {
    if (!isDragging) return
    setPosition(calculatePosition(e.clientX))
  }, [isDragging, calculatePosition])

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Handle touch start
  const handleTouchStart = useCallback((e: TouchEvent) => {
    setIsDragging(true)
    setPosition(calculatePosition(e.touches[0].clientX))
  }, [calculatePosition])

  // Handle touch move
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return
    setPosition(calculatePosition(e.touches[0].clientX))
  }, [isDragging, calculatePosition])

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 2
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault()
        setPosition((prev) => Math.max(0, prev - step))
        break
      case 'ArrowRight':
        e.preventDefault()
        setPosition((prev) => Math.min(100, prev + step))
        break
      case 'Home':
        e.preventDefault()
        setPosition(0)
        break
      case 'End':
        e.preventDefault()
        setPosition(100)
        break
    }
  }, [])

  // Global mouse events for smooth dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden select-none ${className}`}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      role="slider"
      aria-label="Image comparison slider"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(position)}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Processed image (full width, checkerboard background) */}
      <div className="absolute inset-0 checkerboard">
        <img
          src={processedSrc}
          alt={`${alt} - processed`}
          className="w-full h-full object-contain"
          draggable={false}
        />
      </div>

      {/* Original image (clipped) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${position}%` }}
      >
        <div className="relative w-full h-full" style={{ width: `${100 / (position / 100)}%` }}>
          <img
            src={originalSrc}
            alt={`${alt} - original`}
            className="w-full h-full object-contain"
            style={{ maxWidth: 'none', width: `${(100 / position) * 100}%` }}
            draggable={false}
          />
        </div>
      </div>

      {/* Divider line */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize"
        style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
      >
        {/* Handle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
          <svg
            className="w-4 h-4 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 9l4-4 4 4m0 6l-4 4-4-4"
            />
          </svg>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-4 left-4 px-2 py-1 bg-background/80 backdrop-blur-sm rounded text-xs font-medium">
        Original
      </div>
      <div className="absolute top-4 right-4 px-2 py-1 bg-background/80 backdrop-blur-sm rounded text-xs font-medium">
        Processed
      </div>
    </div>
  )
}

export default ComparisonSlider
