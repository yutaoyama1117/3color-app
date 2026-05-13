export type SyncEntity = 'contents' | 'marks' | 'tags'
export type SyncAction = 'create' | 'update' | 'delete'

export interface SyncOperation {
  entity: SyncEntity
  action: SyncAction
  /** サーバー側 ID（update/delete時） */
  id?: string
  /** クライアント側仮 ID（create時） */
  client_id?: string
  data?: Record<string, unknown>
  client_timestamp: string
}

export interface SyncPushRequest {
  operations: SyncOperation[]
}

export interface SyncResultItem {
  client_id?: string
  id?: string
  server_id?: string
  status: 'created' | 'updated' | 'deleted' | 'conflict' | 'error'
  server_version?: Record<string, unknown>
  error?: string
}

export interface SyncChangesResponse {
  data: {
    contents: { created: unknown[]; updated: unknown[]; deleted: Array<{ id: string; deleted_at: string }> }
    marks: { created: unknown[]; updated: unknown[]; deleted: Array<{ id: string; deleted_at: string }> }
    tags: { created: unknown[]; updated: unknown[]; deleted: Array<{ id: string; deleted_at: string }> }
  }
  sync_cursor: string
}

const VALID_ENTITIES: SyncEntity[] = ['contents', 'marks', 'tags']
const VALID_ACTIONS: SyncAction[] = ['create', 'update', 'delete']

export function validateSyncPush(input: unknown): { ok: true; data: SyncPushRequest } | { ok: false; error: string } {
  if (!input || typeof input !== 'object') return { ok: false, error: 'リクエストボディが不正です' }
  const v = input as Record<string, unknown>
  if (!Array.isArray(v.operations)) return { ok: false, error: 'operations は配列' }

  for (const op of v.operations) {
    if (!op || typeof op !== 'object') return { ok: false, error: 'operation 要素が不正' }
    const o = op as Record<string, unknown>
    if (typeof o.entity !== 'string' || !VALID_ENTITIES.includes(o.entity as SyncEntity)) {
      return { ok: false, error: `entity が不正: ${String(o.entity)}` }
    }
    if (typeof o.action !== 'string' || !VALID_ACTIONS.includes(o.action as SyncAction)) {
      return { ok: false, error: `action が不正: ${String(o.action)}` }
    }
    if (typeof o.client_timestamp !== 'string') {
      return { ok: false, error: 'client_timestamp が必要' }
    }
    if (o.action === 'create' && !o.client_id) {
      return { ok: false, error: 'create には client_id が必要' }
    }
    if ((o.action === 'update' || o.action === 'delete') && !o.id) {
      return { ok: false, error: `${o.action} には id が必要` }
    }
  }

  return { ok: true, data: v as unknown as SyncPushRequest }
}
