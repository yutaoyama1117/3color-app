import { contextBridge, ipcRenderer } from 'electron'

/**
 * Renderer プロセスから安全に呼び出せる API。
 * window.electronAPI で公開される。
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // ファイルシステム
  selectFolder: (): Promise<string | null> => ipcRenderer.invoke('select-folder'),
  writeFile: (filePath: string, content: string): Promise<void> =>
    ipcRenderer.invoke('write-file', filePath, content),
  readSettings: (): Promise<Record<string, unknown>> => ipcRenderer.invoke('read-settings'),
  saveSettings: (settings: Record<string, unknown>): Promise<void> =>
    ipcRenderer.invoke('save-settings', settings),

  // Obsidian 同期
  obsidianSyncFile: (relPath: string, content: string): Promise<void> =>
    ipcRenderer.invoke('obsidian-sync-file', relPath, content),
  obsidianSyncAll: (files: Array<{ path: string; content: string }>): Promise<{ written: number }> =>
    ipcRenderer.invoke('obsidian-sync-all', files),
  obsidianGetVaultPath: (): Promise<string | null> => ipcRenderer.invoke('obsidian-get-vault-path'),
  obsidianSetVaultPath: (path: string): Promise<void> =>
    ipcRenderer.invoke('obsidian-set-vault-path', path),
  obsidianGetSyncLog: (): Promise<Array<{ time: string; message: string; success: boolean }>> =>
    ipcRenderer.invoke('obsidian-get-sync-log'),

  // 通知
  notify: (options: { title: string; body: string }) => ipcRenderer.send('notify', options),

  // プラットフォーム
  platform: process.platform,
  isElectron: true,
})
