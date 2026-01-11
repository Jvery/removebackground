/**
 * Backend Detection Module
 *
 * Detects the best available ML inference backend for the browser.
 * Priority: WebGPU > WebGL > CPU
 *
 * WebGPU provides the best performance for ML inference but has limited browser support.
 * WebGL is widely supported and provides good GPU acceleration.
 * CPU is the fallback when no GPU acceleration is available.
 */

// WebGPU types for browsers that support it
interface GPUAdapter {
  requestDevice(): Promise<GPUDevice>
}

interface GPUDevice {
  destroy(): void
}

interface GPUInterface {
  requestAdapter(): Promise<GPUAdapter | null>
}

export type Backend = 'webgpu' | 'webgl' | 'cpu'

export interface BackendInfo {
  backend: Backend
  name: string
  description: string
  supported: boolean
}

/**
 * Check if WebGPU is available in the current browser
 */
export async function isWebGPUAvailable(): Promise<boolean> {
  if (typeof navigator === 'undefined') return false
  if (!('gpu' in navigator)) return false

  try {
    // Access WebGPU API - types may not be available in all TypeScript configs
    const nav = navigator as Navigator & { gpu?: GPUInterface }
    const gpu = nav.gpu
    if (!gpu) return false

    const adapter = await gpu.requestAdapter()
    if (!adapter) return false

    const device = await adapter.requestDevice()
    if (!device) return false

    // Clean up - destroy the device since we're just testing availability
    device.destroy()

    return true
  } catch {
    return false
  }
}

/**
 * Check if WebGL is available in the current browser
 */
export function isWebGLAvailable(): boolean {
  if (typeof document === 'undefined') return false

  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
    return gl !== null
  } catch {
    return false
  }
}

/**
 * Detect the best available backend for ML inference
 * Returns the most performant backend that is supported
 */
export async function detectBestBackend(): Promise<Backend> {
  // Try WebGPU first - best performance
  if (await isWebGPUAvailable()) {
    return 'webgpu'
  }

  // Fall back to WebGL - good performance, wider support
  if (isWebGLAvailable()) {
    return 'webgl'
  }

  // Last resort - CPU (WASM)
  return 'cpu'
}

/**
 * Get detailed information about all available backends
 */
export async function getBackendInfo(): Promise<BackendInfo[]> {
  const webgpuSupported = await isWebGPUAvailable()
  const webglSupported = isWebGLAvailable()

  return [
    {
      backend: 'webgpu',
      name: 'WebGPU',
      description: 'Best performance, limited browser support',
      supported: webgpuSupported,
    },
    {
      backend: 'webgl',
      name: 'WebGL',
      description: 'Good performance, wide browser support',
      supported: webglSupported,
    },
    {
      backend: 'cpu',
      name: 'CPU (WASM)',
      description: 'Fallback option, slower but always available',
      supported: true, // CPU/WASM is always available
    },
  ]
}

/**
 * Get a human-readable name for a backend
 */
export function getBackendDisplayName(backend: Backend): string {
  switch (backend) {
    case 'webgpu':
      return 'WebGPU (Fastest)'
    case 'webgl':
      return 'WebGL'
    case 'cpu':
      return 'CPU'
  }
}
