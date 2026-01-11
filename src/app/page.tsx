'use client'

/**
 * Background Removal Application - Main Page
 *
 * A privacy-focused, client-side background removal tool.
 * All image processing happens in the browser using WebGPU/WebGL.
 * No images are uploaded to any server.
 */

import { useCallback, useState } from 'react'
import { DropZone } from '@/components/drop-zone'
import { ImagePreview } from '@/components/image-preview'
import { ProgressIndicator } from '@/components/progress-indicator'
import { DownloadButton } from '@/components/download-button'
import { ErrorBoundary, ErrorFallback } from '@/components/error-boundary'
import { ThemeToggle } from '@/components/theme-toggle'
import { useProcessing } from '@/lib/use-processing'

type AppState = 'upload' | 'processing' | 'result'

function HomePage() {
  const [appState, setAppState] = useState<AppState>('upload')
  const [error, setError] = useState<string | null>(null)

  const {
    state: processingState,
    processImage,
    cancel,
    reset: resetProcessing,
  } = useProcessing()

  // Handle image selection from DropZone
  const handleImageReady = useCallback(async (file: File) => {
    setError(null)
    setAppState('processing')

    try {
      await processImage(file)
      setAppState('result')
    } catch (err) {
      // Error is handled by useProcessing, but we need to update app state
      if (err instanceof Error && err.message.includes('abort')) {
        // User cancelled - go back to upload
        setAppState('upload')
      } else {
        setAppState('result') // Show error in result view
      }
    }
  }, [processImage])

  // Handle upload errors from DropZone
  const handleUploadError = useCallback((errorMessage: string) => {
    setError(errorMessage)
  }, [])

  // Handle cancel during processing
  const handleCancel = useCallback(() => {
    cancel()
    setAppState('upload')
  }, [cancel])

  // Reset to start over
  const handleStartOver = useCallback(() => {
    resetProcessing()
    setError(null)
    setAppState('upload')
  }, [resetProcessing])

  // Handle download success
  const handleDownload = useCallback(() => {
    // Could add analytics or toast notification here
  }, [])

  // Handle copy success
  const handleCopy = useCallback(() => {
    // Could add toast notification here
  }, [])

  // Handle export error
  const handleExportError = useCallback((errorMessage: string) => {
    setError(errorMessage)
  }, [])

  // Determine if we're in a loading/processing state
  const isProcessing = processingState.status === 'loading' || processingState.status === 'processing'
  const hasResult = processingState.status === 'complete' && processingState.processedImage
  const hasError = processingState.status === 'error'

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="relative py-6 px-4 text-center">
        {/* Theme toggle in top right */}
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
          removebackground
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Remove backgrounds instantly — 100% in your browser
        </p>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
        <div className="w-full max-w-4xl">

          {/* Upload state */}
          {appState === 'upload' && !isProcessing && (
            <div className="space-y-6">
              <DropZone
                onImageReady={handleImageReady}
                onError={handleUploadError}
                disabled={isProcessing}
                className="max-w-2xl mx-auto"
              />

              {error && (
                <div className="max-w-2xl mx-auto p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                  <p className="text-sm text-destructive text-center">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Processing state */}
          {isProcessing && (
            <div className="space-y-6">
              {/* Show original image during processing */}
              {processingState.originalImage && (
                <ImagePreview
                  originalUrl={processingState.originalImage.url}
                  processedUrl={null}
                  isProcessing={true}
                  progress={processingState.progress}
                  className="max-w-3xl mx-auto"
                />
              )}

              {/* Progress indicator */}
              <ProgressIndicator
                status={processingState.status}
                progress={processingState.progress}
                onCancel={handleCancel}
              />
            </div>
          )}

          {/* Result state */}
          {appState === 'result' && !isProcessing && (
            <div className="space-y-6">
              {/* Error state */}
              {hasError && (
                <ErrorFallback
                  error={new Error(processingState.error || 'Processing failed')}
                  onReset={handleStartOver}
                  title="Processing failed"
                  className="max-w-2xl mx-auto"
                />
              )}

              {/* Success state */}
              {hasResult && processingState.originalImage && processingState.processedImage && (
                <>
                  {/* Image preview with comparison */}
                  <ImagePreview
                    originalUrl={processingState.originalImage.url}
                    processedUrl={processingState.processedImage.url}
                    className="max-w-3xl mx-auto"
                  />

                  {/* Processing time info */}
                  {processingState.processingTimeMs && (
                    <p className="text-center text-sm text-muted-foreground">
                      Processed in {(processingState.processingTimeMs / 1000).toFixed(1)}s
                    </p>
                  )}

                  {/* Download and actions */}
                  <div className="max-w-md mx-auto space-y-4">
                    <DownloadButton
                      blob={processingState.processedImage.blob}
                      originalFilename={processingState.originalImage.file.name}
                      onDownload={handleDownload}
                      onCopy={handleCopy}
                      onError={handleExportError}
                    />

                    {/* Start over button */}
                    <button
                      type="button"
                      onClick={handleStartOver}
                      className="w-full py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Process another image
                    </button>
                  </div>

                  {/* Error message if export failed */}
                  {error && (
                    <div className="max-w-md mx-auto p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                      <p className="text-sm text-destructive text-center">{error}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 px-4 text-center border-t border-border">
        <div className="max-w-2xl mx-auto space-y-2">
          {/* Privacy badge */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <span>Your images never leave your device</span>
          </div>

          {/* Additional privacy info */}
          <p className="text-xs text-muted-foreground/70">
            100% client-side processing • Works offline after first load • No account required
          </p>
        </div>
      </footer>
    </main>
  )
}

export default function Home() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log error for debugging
        console.error('Application error:', error, errorInfo)
      }}
      onReset={() => {
        // Could clear any persisted state here if needed
      }}
    >
      <HomePage />
    </ErrorBoundary>
  )
}
