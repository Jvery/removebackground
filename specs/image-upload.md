# Image Upload & Input

## Overview

The image input system that handles various ways users can provide images for background removal. All processing happens client-side — no uploads to server.

## Input Methods

### Drag & Drop

- Full-page drop zone with visual feedback
- Accept multiple files (process sequentially or show selection)
- Visual indication when dragging over the page
- Reject non-image files with helpful message

### File Picker

- Standard file input with custom styled button
- Accept: image/png, image/jpeg, image/webp, image/gif (first frame)
- No file size limit (warn for files > 20MB about processing time)

### Paste from Clipboard

- Listen for paste events globally
- Extract image data from clipboard
- Works with screenshots and copied images

### URL Input (Optional Enhancement)

- Text input for image URLs
- Fetch and process remote images
- Handle CORS restrictions gracefully

## Image Validation

- Validate file type via magic bytes (not just extension)
- Check for corrupted/invalid images
- Minimum dimensions: 10x10 pixels
- Maximum dimensions: 8192x8192 pixels (warn, don't block)
- Provide helpful error messages for invalid inputs

## Acceptance Criteria

- [ ] Drag & drop works across all supported browsers
- [ ] Visual feedback when dragging files over the page
- [ ] File picker opens and accepts images correctly
- [ ] Paste from clipboard captures screenshots
- [ ] Invalid files show clear, helpful error messages
- [ ] Large files show processing time warning
- [ ] Input triggers processing pipeline immediately

## State Management

```typescript
type InputState = 
  | { status: 'idle' }
  | { status: 'dragging' }
  | { status: 'validating'; file: File }
  | { status: 'ready'; file: File; preview: string }
  | { status: 'error'; message: string };
```

## Accessibility

- Keyboard-accessible file picker
- Screen reader announcements for drag/drop states
- Focus management after file selection
- Clear error messages linked to inputs
