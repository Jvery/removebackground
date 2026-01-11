'use client'

import { useEffect } from 'react'

/**
 * PWA Service Worker Registration Component
 *
 * Registers the service worker for offline functionality and caching.
 * Only runs in production to avoid caching issues during development.
 */
export function PWARegister() {
  useEffect(() => {
    // Only register in production
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator) ||
      process.env.NODE_ENV === 'development'
    ) {
      return
    }

    // Register service worker
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service worker registered:', registration.scope)

          // Check for updates periodically
          setInterval(() => {
            registration.update()
          }, 60 * 60 * 1000) // Check every hour
        })
        .catch((error) => {
          console.error('[PWA] Service worker registration failed:', error)
        })
    })

    // Handle service worker updates
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // New service worker activated - could prompt for refresh
      console.log('[PWA] New service worker activated')
    })
  }, [])

  return null
}
