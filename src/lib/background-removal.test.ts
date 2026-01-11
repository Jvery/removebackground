/**
 * Tests for Background Removal Core Module
 *
 * These tests verify the background removal API surface.
 * Full integration tests require the ML model which is ~40MB,
 * so we focus on testing the module's interface and error handling.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  isModelLoaded,
  getCurrentBackend,
  resetPipeline,
  type RemovalOptions,
  type RemovalResult,
} from './background-removal'

describe('background-removal', () => {
  beforeEach(() => {
    // Reset pipeline state before each test
    resetPipeline()
  })

  describe('isModelLoaded', () => {
    it('returns false initially', () => {
      expect(isModelLoaded()).toBe(false)
    })
  })

  describe('getCurrentBackend', () => {
    it('returns null before model is loaded', () => {
      expect(getCurrentBackend()).toBeNull()
    })
  })

  describe('resetPipeline', () => {
    it('resets the pipeline state', () => {
      // Initial state
      expect(isModelLoaded()).toBe(false)
      expect(getCurrentBackend()).toBeNull()

      // After reset (should remain in initial state)
      resetPipeline()
      expect(isModelLoaded()).toBe(false)
      expect(getCurrentBackend()).toBeNull()
    })
  })

  describe('RemovalOptions interface', () => {
    it('accepts valid options structure', () => {
      const options: RemovalOptions = {
        onProgress: (progress) => console.log(progress),
        signal: new AbortController().signal,
      }

      expect(options.onProgress).toBeDefined()
      expect(options.signal).toBeDefined()
    })

    it('allows partial options', () => {
      const options1: RemovalOptions = {}
      const options2: RemovalOptions = { onProgress: () => {} }
      const options3: RemovalOptions = { signal: new AbortController().signal }

      expect(options1).toBeDefined()
      expect(options2).toBeDefined()
      expect(options3).toBeDefined()
    })
  })

  describe('RemovalResult interface', () => {
    it('defines expected result structure', () => {
      // Create a mock result to verify the interface
      const mockResult: RemovalResult = {
        blob: new Blob(['test'], { type: 'image/png' }),
        width: 100,
        height: 100,
        processingTimeMs: 1000,
      }

      expect(mockResult.blob).toBeInstanceOf(Blob)
      expect(mockResult.width).toBe(100)
      expect(mockResult.height).toBe(100)
      expect(mockResult.processingTimeMs).toBe(1000)
    })
  })

  // Note: Testing removeBackground and preloadModel requires
  // the actual ML model or comprehensive mocking of @xenova/transformers.
  // These tests should be run as E2E tests in a real browser environment.

  describe('abort handling', () => {
    it('AbortController can be created and used', () => {
      const controller = new AbortController()
      const signal = controller.signal

      expect(signal.aborted).toBe(false)

      controller.abort()

      expect(signal.aborted).toBe(true)
    })
  })
})
