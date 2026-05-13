'use client'

import { useEffect, useState } from 'react'
import { getElectronAPI } from '@/lib/platform'
import { syncAll } from '@/lib/obsidian/sync-engine'
import { useContentStore } from '@/stores/contentStore'
import { useMarkStore } from '@/stores/markStore'

export interface SyncLogEntry {
  time: string
  message: string
  success: boolean
}

interface UseObsidianSyncResult {
  vaultPath: string | null
  syncLog: SyncLogEntry[]
  isElectron: boolean
  selectVault: () => Promise<void>
  syncNow: () => Promise<{ written: number } | { error: string }>
  refreshLog: () => Promise<void>
}

export function useObsidianSync(): UseObsidianSyncResult {
  const [vaultPath, setVaultPath] = useState<string | null>(null)
  const [syncLog, setSyncLog] = useState<SyncLogEntry[]>([])
  const { contents } = useContentStore()
  const { marks } = useMarkStore()

  const api = getElectronAPI()
  const isElectron = api !== null

  useEffect(() => {
    if (!api) return
    void api.obsidianGetVaultPath().then(setVaultPath)
    void api.obsidianGetSyncLog().then(setSyncLog)
  }, [api])

  const selectVault = async () => {
    if (!api) return
    const path = await api.selectFolder()
    if (path) {
      await api.obsidianSetVaultPath(path)
      setVaultPath(path)
    }
  }

  const syncNow = async () => {
    if (!api) return { error: 'Electron 環境でのみ利用可能です' }
    if (!vaultPath) return { error: 'Vault パスが未設定です' }
    try {
      const result = await syncAll(contents, marks)
      await refreshLog()
      return result
    } catch (err) {
      return { error: err instanceof Error ? err.message : '同期に失敗しました' }
    }
  }

  const refreshLog = async () => {
    if (!api) return
    setSyncLog(await api.obsidianGetSyncLog())
  }

  return { vaultPath, syncLog, isElectron, selectVault, syncNow, refreshLog }
}
