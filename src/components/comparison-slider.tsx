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
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })

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

  // Load image to get natural dimensions for proper aspect ratio
  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.src = originalSrc
  }, [originalSrc])

  // Calculate aspect ratio for the container
  const aspectRatio = imageSize.height > 0 ? imageSize.width / imageSize.height : 16 / 9

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden select-none ${className}`}
      style={{ aspectRatio: aspectRatio }}
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

      {/* Original image (clipped using clip-path) */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <img
          src={originalSrc}
          alt={`${alt} - original`}
          className="w-full h-full object-contain"
          draggable={false}
        />
      </div>

      {/* Divider line */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(0,0,0,0.3)] cursor-ew-resize z-10"
        style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
      >
        {/* Handle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-gray-200">
          <svg
            className="w-5 h-5 text-gray-600"
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
      <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full text-xs font-medium text-white shadow-lg">
        Original
      </div>
      <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full text-xs font-medium text-white shadow-lg">
        Processed
      </div>
    </div>
  )
}

export default ComparisonSlider
