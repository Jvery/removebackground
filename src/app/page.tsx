'use client'

/**
 * Background Removal Application - Main Page
 *
 * A privacy-focused, client-side background removal tool.
 * All image processing happens in the browser using WebGPU/WebGL.
 * No images are uploaded to any server.
 */

import React, { useCallback, useState, useRef, lazy, Suspense } from 'react'
import { DropZone } from '@/components/drop-zone'
import { ErrorBoundary, ErrorFallback } from '@/components/error-boundary'
import { ThemeToggle } from '@/components/theme-toggle'
import { useProcessing } from '@/lib/use-processing'

// Lazy load components only needed during/after processing
const ImagePreview = lazy(() => import('@/components/image-preview'))
const ProgressIndicator = lazy(() => import('@/components/progress-indicator'))
const DownloadButton = lazy(() => import('@/components/download-button'))

type AppState = 'upload' | 'processing' | 'result'

function HomePage() {
  const [appState, setAppState] = useState<AppState>('upload')
  const [error, setError] = useState<string | null>(null)
  const [threshold, setThreshold] = useState(0.4)
  const [isAdjusting, setIsAdjusting] = useState(false)

  const {
    state: processingState,
    processImage,
    reprocessWithThreshold,
    cancel,
    reset: resetProcessing,
  } = useProcessing()

  // Handle image selection from DropZone
  const handleImageReady = useCallback(async (file: File) => {
    setError(null)
    setAppState('processing')

    try {
      await processImage(file, { threshold })
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
  }, [processImage, threshold])

  // Track the latest threshold value for commit (avoids stale closure)
  const latestThresholdRef = useRef(threshold)
  latestThresholdRef.current = threshold

  // Handle threshold slider change (just update visual, don't process)
  const handleThresholdInput = useCallback((newThreshold: number) => {
    setThreshold(newThreshold)
  }, [])

  // Handle threshold change complete (on mouse/touch release)
  const handleThresholdCommit = useCallback(async () => {
    setIsAdjusting(true)
    await reprocessWithThreshold(latestThresholdRef.current)
    setIsAdjusting(false)
  }, [reprocessWithThreshold])

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
    <main className="min-h-screen flex flex-col gradient-mesh noise-bg">
      {/* Header */}
      <header className="relative py-8 px-4">
        {/* Theme toggle in top right */}
        <div className="absolute top-6 right-6 z-10">
          <ThemeToggle />
        </div>

        <div className="max-w-4xl mx-auto text-center">
          {/* Logo/Brand */}
          <div className="animate-fade-in-up">
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                remove
              </span>
              <span className="text-foreground">background</span>
            </h1>
          </div>

          {/* Tagline */}
          <p className="mt-4 text-lg sm:text-xl text-muted-foreground animate-fade-in-up stagger-1">
            Remove backgrounds instantly — 100% in your browser
          </p>

          {/* Privacy badges */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 animate-fade-in-up stagger-2">
            <span className="privacy-badge">
              <ShieldIcon className="w-3.5 h-3.5" />
              Private
            </span>
            <span className="privacy-badge">
              <CloudOffIcon className="w-3.5 h-3.5" />
              No uploads
            </span>
            <span className="privacy-badge">
              <ZapIcon className="w-3.5 h-3.5" />
              Instant
            </span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-12">
        <div className="w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl relative z-10">

          {/* Upload state */}
          {appState === 'upload' && !isProcessing && (
            <div className="space-y-8 animate-scale-in">
              <DropZone
                onImageReady={handleImageReady}
                onError={handleUploadError}
                disabled={isProcessing}
                className="max-w-2xl mx-auto"
              />

              {error && (
                <div className="max-w-2xl mx-auto p-4 bg-destructive/10 border border-destructive/20 rounded-xl animate-fade-in-up" role="alert" aria-live="assertive">
                  <p className="text-sm text-destructive text-center font-medium">{error}</p>
                </div>
              )}

              {/* Features */}
              <div className="max-w-2xl mx-auto grid grid-cols-3 gap-4 animate-fade-in-up stagger-3">
                <FeatureCard
                  icon={<LayersIcon className="w-5 h-5" />}
                  title="AI Powered"
                  description="Neural network precision"
                />
                <FeatureCard
                  icon={<LockIcon className="w-5 h-5" />}
                  title="100% Private"
                  description="Never leaves device"
                />
                <FeatureCard
                  icon={<DownloadIcon className="w-5 h-5" />}
                  title="High Quality"
                  description="PNG & WebP export"
                />
              </div>
            </div>
          )}

          {/* Processing state */}
          {isProcessing && (
            <div className="space-y-6 animate-scale-in">
              <Suspense fallback={<LoadingSpinner />}>
                {/* Show original image during processing */}
                {processingState.originalImage && (
                  <ImagePreview
                    originalUrl={processingState.originalImage.url}
                    processedUrl={null}
                    isProcessing={true}
                    progress={processingState.progress}
                    className="w-full mx-auto"
                  />
                )}

                {/* Progress indicator */}
                <ProgressIndicator
                  status={processingState.status}
                  progress={processingState.progress}
                  onCancel={handleCancel}
                />
              </Suspense>
            </div>
          )}

          {/* Result state */}
          {appState === 'result' && !isProcessing && (
            <div className="space-y-6 animate-scale-in">
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
                <Suspense fallback={<LoadingSpinner />}>
                  {/* Success indicator - announced to screen readers */}
                  <div className="text-center animate-success" role="status" aria-live="polite">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-sm font-medium">
                      <CheckCircleIcon className="w-4 h-4" aria-hidden="true" />
                      Background removed successfully
                    </div>
                  </div>

                  {/* Image preview with comparison */}
                  <ImagePreview
                    originalUrl={processingState.originalImage.url}
                    processedUrl={processingState.processedImage.url}
                    className="w-full mx-auto"
                  />

                  {/* Processing time info */}
                  {processingState.processingTimeMs && (
                    <p className="text-center text-sm text-muted-foreground">
                      Processed in {(processingState.processingTimeMs / 1000).toFixed(1)}s
                    </p>
                  )}

                  {/* Threshold adjustment slider */}
                  <div className="max-w-md mx-auto p-4 bg-card/50 border border-border/50 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <label htmlFor="threshold-slider" className="text-sm font-medium text-foreground flex items-center gap-2">
                        <AdjustIcon className="w-4 h-4 text-primary" />
                        Edge Sensitivity
                      </label>
                      <span className="text-sm text-muted-foreground font-mono">
                        {Math.round(threshold * 100)}%
                      </span>
                    </div>
                    <input
                      id="threshold-slider"
                      type="range"
                      min="0.3"
                      max="0.5"
                      step="0.05"
                      value={threshold}
                      onChange={(e) => handleThresholdInput(parseFloat(e.target.value))}
                      onMouseUp={handleThresholdCommit}
                      onTouchEnd={handleThresholdCommit}
                      disabled={isAdjusting}
                      className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Adjust edge sensitivity threshold"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Remove more background</span>
                      <span>Keep more subject</span>
                    </div>
                    {isAdjusting && (
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        Adjusting...
                      </div>
                    )}
                  </div>

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
                      aria-label="Process another image - start over with a new image"
                      className="w-full py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-xl hover:bg-muted/50"
                    >
                      Process another image
                    </button>
                  </div>

                  {/* Error message if export failed */}
                  {error && (
                    <div className="max-w-md mx-auto p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
                      <p className="text-sm text-destructive text-center font-medium">{error}</p>
                    </div>
                  )}
                </Suspense>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border/50">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          {/* Privacy statement */}
          <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
            <ShieldCheckIcon className="w-5 h-5 text-primary" />
            <span>Your images never leave your device</span>
          </div>

          {/* Additional info */}
          <p className="text-xs text-muted-foreground/60">
            100% client-side processing using AI • Works offline after first load • No account required
          </p>

          {/* Tech badge */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/40">
            <span>Powered by</span>
            <span className="font-medium text-muted-foreground/60">Transformers.js</span>
          </div>
        </div>
      </footer>
    </main>
  )
}

// Loading spinner for Suspense fallback
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  )
}

// Feature card component
function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center p-4 rounded-xl bg-card/50 border border-border/50 text-center">
      <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </div>
  )
}

// Icon components
function ShieldIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )
}

function CloudOffIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m-3.536-3.536a5 5 0 000-7.072M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
    </svg>
  )
}

function ZapIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )
}

function LayersIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  )
}

function LockIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )
}

function DownloadIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  )
}

function CheckCircleIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function ShieldCheckIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )
}

function AdjustIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
    </svg>
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
