# Image Preview & Comparison

## Overview

The visual interface for displaying original and processed images, allowing users to compare results and verify the background removal quality.

## Preview States

### Before Processing

- Show uploaded image with checkerboard pattern indicating future transparency
- Display image dimensions and file size
- "Remove Background" button prominently displayed

### During Processing

- Original image visible but slightly dimmed
- Animated progress indicator overlay
- Progress percentage or stage indicator
- Cancel button available

### After Processing

- Side-by-side or slider comparison view
- Processed image on checkerboard background (shows transparency)
- Toggle between views: Original | Processed | Comparison
- Zoom/pan capability for detail inspection

## Comparison Modes

### Slider Comparison (Default)

- Vertical divider that user can drag left/right
- Left side: original image
- Right side: processed image with checkerboard
- Smooth, responsive dragging

### Toggle View

- Single image display
- Button to switch between original/processed
- Keyboard shortcut (Space) for quick toggle

### Side-by-Side

- Two images displayed next to each other
- Synchronized zoom/pan between both
- Responsive layout (stack on mobile)

## Checkerboard Pattern

- Standard transparency indicator pattern
- Light/dark gray squares (not too contrasting)
- Pattern scales appropriately with zoom
- CSS-based for performance

## Acceptance Criteria

- [ ] Preview loads immediately after image selection
- [ ] Progress indicator shows during processing
- [ ] Slider comparison is smooth and responsive
- [ ] Checkerboard clearly indicates transparent areas
- [ ] Zoom/pan works with mouse wheel and touch gestures
- [ ] Comparison mode persists across sessions (localStorage)
- [ ] Mobile-friendly layout and interactions

## Zoom & Pan

- Mouse wheel to zoom (centered on cursor)
- Click and drag to pan
- Double-click to reset zoom
- Pinch-to-zoom on touch devices
- Zoom limits: 0.5x to 4x

## Performance

- Use `<canvas>` for large images to avoid DOM memory issues
- Lazy render high-resolution details
- Debounce resize handlers
- RequestAnimationFrame for smooth animations
