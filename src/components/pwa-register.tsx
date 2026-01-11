'use client'

import { useEffect } from 'react'

/**
 * PWA Service Worker Registration Component
 *
 * Registers the service worker for offline functionality and caching.
 * Checks for updates on page focus and periodically.
 */
export function PWARegister() {
  useEffect(() => {
    // Only register in browser with service worker support
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    // Skip in development to avoid caching issues
    if (process.env.NODE_ENV === 'development') {
      return
    }

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        console.log('[PWA] Service worker registered:', registration.scope)

        // Check for updates immediately
        registration.update()

        // Check for updates periodically (every 30 minutes)
        const updateInterval = setInterval(() => {
          registration.update()
        }, 30 * 60 * 1000)

        // Check for updates when page becomes visible
        const handleVisibilityChange = () => {
          if (document.visibilityState === 'visible') {
            registration.update()
          }
        }
        document.addEventListener('visibilitychange', handleVisibilityChange)

        // Check for updates on online event (when coming back online)
        const handleOnline = () => {
          registration.update()
        }
        window.addEventListener('online', handleOnline)

        // Cleanup
        return () => {
          clearInterval(updateInterval)
          document.removeEventListener('visibilitychange', handleVisibilityChange)
          window.removeEventListener('online', handleOnline)
        }
      } catch (error) {
        console.error('[PWA] Service worker registration failed:', error)
      }
    }

    // Register after page load
    if (document.readyState === 'complete') {
      registerSW()
    } else {
      window.addEventListener('load', registerSW)
    }
  }, [])

  return null
}
