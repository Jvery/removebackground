/**
 * Model Cache Module
 *
 * Manages IndexedDB storage for ML model files (~40MB).
 * Caching improves subsequent load times and enables offline functionality.
 */

const DB_NAME = 'removebackground-models'
const DB_VERSION = 1
const STORE_NAME = 'models'
const MODEL_KEY = 'rmbg-1.4'
const MODEL_VERSION = '1.0.0'

export interface CachedModel {
  key: string
  version: string
  data: ArrayBuffer
  timestamp: number
}

/**
 * Open or create the IndexedDB database
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available'))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'))
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' })
      }
    }
  })
}

/**
 * Check if the model is cached in IndexedDB
 */
export async function isModelCached(): Promise<boolean> {
  try {
    const db = await openDatabase()
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(MODEL_KEY)

      request.onsuccess = () => {
        const cached = request.result as CachedModel | undefined
        // Check if cached and version matches
        resolve(cached !== undefined && cached.version === MODEL_VERSION)
      }

      request.onerror = () => {
        resolve(false)
      }

      transaction.oncomplete = () => {
        db.close()
      }
    })
  } catch {
    return false
  }
}

/**
 * Get the cached model from IndexedDB
 */
export async function getModelFromCache(): Promise<ArrayBuffer | null> {
  try {
    const db = await openDatabase()
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(MODEL_KEY)

      request.onsuccess = () => {
        const cached = request.result as CachedModel | undefined
        if (cached && cached.version === MODEL_VERSION) {
          resolve(cached.data)
        } else {
          resolve(null)
        }
      }

      request.onerror = () => {
        resolve(null)
      }

      transaction.oncomplete = () => {
        db.close()
      }
    })
  } catch {
    return null
  }
}

/**
 * Save the model to IndexedDB cache
 */
export async function saveModelToCache(data: ArrayBuffer): Promise<void> {
  try {
    const db = await openDatabase()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)

      const cached: CachedModel = {
        key: MODEL_KEY,
        version: MODEL_VERSION,
        data,
        timestamp: Date.now(),
      }

      const request = store.put(cached)

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        reject(new Error('Failed to save model to cache'))
      }

      transaction.oncomplete = () => {
        db.close()
      }
    })
  } catch (error) {
    throw new Error(`Failed to save model to cache: ${error}`)
  }
}

/**
 * Clear the model from IndexedDB cache
 */
export async function clearModelCache(): Promise<void> {
  try {
    const db = await openDatabase()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(MODEL_KEY)

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        reject(new Error('Failed to clear model cache'))
      }

      transaction.oncomplete = () => {
        db.close()
      }
    })
  } catch (error) {
    throw new Error(`Failed to clear model cache: ${error}`)
  }
}

/**
 * Get information about the cached model
 */
export async function getCacheInfo(): Promise<{
  isCached: boolean
  version: string | null
  timestamp: number | null
  sizeBytes: number | null
}> {
  try {
    const db = await openDatabase()
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(MODEL_KEY)

      request.onsuccess = () => {
        const cached = request.result as CachedModel | undefined
        if (cached) {
          resolve({
            isCached: cached.version === MODEL_VERSION,
            version: cached.version,
            timestamp: cached.timestamp,
            sizeBytes: cached.data.byteLength,
          })
        } else {
          resolve({
            isCached: false,
            version: null,
            timestamp: null,
            sizeBytes: null,
          })
        }
      }

      request.onerror = () => {
        resolve({
          isCached: false,
          version: null,
          timestamp: null,
          sizeBytes: null,
        })
      }

      transaction.oncomplete = () => {
        db.close()
      }
    })
  } catch {
    return {
      isCached: false,
      version: null,
      timestamp: null,
      sizeBytes: null,
    }
  }
}
