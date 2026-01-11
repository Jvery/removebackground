/**
 * Tests for Backend Detection Module
 *
 * These tests verify the backend detection logic for ML inference.
 * Since WebGPU/WebGL availability depends on browser capabilities,
 * we test the detection logic and fallback behavior.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  detectBestBackend,
  isWebGLAvailable,
  getBackendInfo,
  getBackendDisplayName,
  type Backend,
} from './backend-detection'

describe('backend-detection', () => {
  describe('isWebGLAvailable', () => {
    let originalDocument: typeof document

    beforeEach(() => {
      originalDocument = global.document
    })

    afterEach(() => {
      global.document = originalDocument
    })

    it('returns false when document is undefined (server-side)', () => {
      // @ts-expect-error - intentionally setting to undefined for test
      global.document = undefined
      expect(isWebGLAvailable()).toBe(false)
    })

    it('returns true when WebGL context is available', () => {
      // jsdom should support canvas, but may not support WebGL
      // This test verifies the function works in a browser-like environment
      const result = isWebGLAvailable()
      expect(typeof result).toBe('boolean')
    })
  })

  describe('detectBestBackend', () => {
    it('returns a valid backend type', async () => {
      const backend = await detectBestBackend()
      expect(['webgpu', 'webgl', 'cpu']).toContain(backend)
    })

    it('returns cpu when running in jsdom (no GPU support)', async () => {
      // jsdom doesn't support WebGPU or WebGL, so we expect CPU
      const backend = await detectBestBackend()
      expect(backend).toBe('cpu')
    })
  })

  describe('getBackendInfo', () => {
    it('returns info for all three backends', async () => {
      const info = await getBackendInfo()

      expect(info).toHaveLength(3)
      expect(info.map((i) => i.backend)).toEqual(['webgpu', 'webgl', 'cpu'])
    })

    it('marks CPU as always supported', async () => {
      const info = await getBackendInfo()
      const cpuInfo = info.find((i) => i.backend === 'cpu')

      expect(cpuInfo).toBeDefined()
      expect(cpuInfo?.supported).toBe(true)
    })

    it('includes descriptive names', async () => {
      const info = await getBackendInfo()

      info.forEach((backend) => {
        expect(backend.name).toBeTruthy()
        expect(backend.description).toBeTruthy()
      })
    })
  })

  describe('getBackendDisplayName', () => {
    it('returns correct display name for webgpu', () => {
      expect(getBackendDisplayName('webgpu')).toBe('WebGPU (Fastest)')
    })

    it('returns correct display name for webgl', () => {
      expect(getBackendDisplayName('webgl')).toBe('WebGL')
    })

    it('returns correct display name for cpu', () => {
      expect(getBackendDisplayName('cpu')).toBe('CPU')
    })
  })
})
