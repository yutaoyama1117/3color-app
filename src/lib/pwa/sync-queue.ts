/**
 * オフライン時のミューテーションキュー。
 * IndexedDB に保存し、オンライン復帰時に Background Sync API で実行する。
 */

const DB_NAME = '3color-sync-queue'
const STORE_NAME = 'operations'
const DB_VERSION = 1

export interface QueuedOperation {
  id: string
  url: string
  method: 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
  createdAt: number
  retries: number
}

/** IndexedDB を開く */
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB が利用できません'))
      return
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

/** オペレーションをキューに追加 */
export async function enqueueOperation(op: Omit<QueuedOperation, 'id' | 'createdAt' | 'retries'>): Promise<string> {
  const db = await openDb()
  const id = `op-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  const operation: QueuedOperation = {
    ...op,
    id,
    createdAt: Date.now(),
    retries: 0,
  }
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(operation)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  return id
}

/** 全オペレーションを取得 */
export async function getAllOperations(): Promise<QueuedOperation[]> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).getAll()
    req.onsuccess = () => resolve(req.result as QueuedOperation[])
    req.onerror = () => reject(req.error)
  })
}

/** オペレーションを削除 */
export async function deleteOperation(id: string): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/** リトライ回数をインクリメント */
export async function incrementRetry(id: string): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const getReq = store.get(id)
    getReq.onsuccess = () => {
      const op = getReq.result as QueuedOperation | undefined
      if (op) {
        op.retries++
        store.put(op)
      }
    }
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/** キューを順次実行する */
export async function processQueue(): Promise<{ success: number; failed: number }> {
  const operations = await getAllOperations()
  let success = 0
  let failed = 0

  for (const op of operations) {
    try {
      const res = await fetch(op.url, {
        method: op.method,
        headers: { 'Content-Type': 'application/json', ...(op.headers ?? {}) },
        body: op.body ? JSON.stringify(op.body) : undefined,
      })
      if (res.ok) {
        await deleteOperation(op.id)
        success++
      } else {
        await incrementRetry(op.id)
        failed++
      }
    } catch {
      await incrementRetry(op.id)
      failed++
    }
  }

  return { success, failed }
}
