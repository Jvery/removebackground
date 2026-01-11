# Download & Export

## Overview

The export system for downloading processed images with transparent backgrounds. All export operations happen client-side — no server involvement.

## Export Formats

### PNG (Default)

- Lossless with alpha channel
- Original resolution preserved
- Optimal compression applied
- Best for graphics, logos, product photos

### WebP (Optional)

- Smaller file size than PNG
- Full alpha channel support
- Configurable quality (default 95%)
- Fallback to PNG if browser doesn't support

## Download Flow

1. User clicks "Download" button
2. Generate blob in selected format
3. Create object URL
4. Trigger download with meaningful filename
5. Revoke object URL after download starts

## Filename Generation

Pattern: `{original-name}-nobg.{ext}`

Examples:
- `photo.jpg` → `photo-nobg.png`
- `product-image.png` → `product-image-nobg.png`
- Clipboard paste → `image-nobg.png`

## Acceptance Criteria

- [ ] Download produces correct PNG with transparency
- [ ] Original resolution is preserved (not downscaled)
- [ ] Filename is meaningful and includes "-nobg" suffix
- [ ] Download works on all supported browsers
- [ ] Large images (>20MB output) don't crash browser
- [ ] Download button shows loading state during generation
- [ ] Multiple downloads of same image don't leak memory

## Quick Actions

### Copy to Clipboard

- Copy processed image directly to clipboard
- Show success/failure toast notification
- Works with Clipboard API (modern browsers)
- Fallback: disabled with tooltip explaining limitation

### Share (Optional Enhancement)

- Web Share API for mobile devices
- Share as file attachment
- Fallback: show share URL or disabled state

## Memory Management

- Release object URLs after use
- Clear canvas/blob references after download
- Provide "Start Over" action to fully reset state

## Error Handling

- Handle out-of-memory during PNG encoding
- Retry with lower quality if initial attempt fails
- Clear error messages for unsupported operations
