/**
 * Web / Electron 実行環境の判定とプラットフォーム抽象 API。
 */

export interface ElectronAPI {
  selectFolder: () => Promise<string | null>
  writeFile: (path: string, content: string) => Promise<void>
  readSettings: () => Promise<Record<string, unknown>>
  saveSettings: (settings: Record<string, unknown>) => Promise<void>
  obsidianSyncFile: (relPath: string, content: string) => Promise<void>
  obsidianSyncAll: (files: Array<{ path: string; content: string }>) => Promise<{ written: number }>
  obsidianGetVaultPath: () => Promise<string | null>
  obsidianSetVaultPath: (path: string) => Promise<void>
  obsidianGetSyncLog: () => Promise<Array<{ time: string; message: string; success: boolean }>>
  notify: (options: { title: string; body: string }) => void
  platform: string
  isElectron: true
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

export const isElectron: boolean =
  typeof window !== 'undefined' && window.electronAPI?.isElectron === true

/** Electron 環境で動作している場合のみ ElectronAPI を返す */
export function getElectronAPI(): ElectronAPI | null {
  if (typeof window === 'undefined') return null
  return window.electronAPI ?? null
}

/** プラットフォーム名（'web' | 'darwin' | 'win32' | ...） */
export function getPlatform(): string {
  if (typeof window === 'undefined') return 'server'
  return window.electronAPI?.platform ?? 'web'
}
