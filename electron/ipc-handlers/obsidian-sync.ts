import type { IpcMain } from 'electron'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const CONFIG_PATH = path.join(os.homedir(), '.3color-app', 'obsidian.json')
const LOG_PATH = path.join(os.homedir(), '.3color-app', 'sync-log.json')
const MAX_LOG_ENTRIES = 50

interface SyncLogEntry {
  time: string
  message: string
  success: boolean
}

async function readConfig(): Promise<{ vaultPath?: string }> {
  try {
    return JSON.parse(await fs.readFile(CONFIG_PATH, 'utf8'))
  } catch {
    return {}
  }
}

async function writeConfig(cfg: { vaultPath?: string }): Promise<void> {
  await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true })
  await fs.writeFile(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf8')
}

async function readLog(): Promise<SyncLogEntry[]> {
  try {
    return JSON.parse(await fs.readFile(LOG_PATH, 'utf8'))
  } catch {
    return []
  }
}

async function appendLog(entry: SyncLogEntry): Promise<void> {
  const log = await readLog()
  log.unshift(entry)
  await fs.mkdir(path.dirname(LOG_PATH), { recursive: true })
  await fs.writeFile(LOG_PATH, JSON.stringify(log.slice(0, MAX_LOG_ENTRIES), null, 2), 'utf8')
}

export function registerObsidianSyncHandlers(ipcMain: IpcMain) {
  ipcMain.handle('obsidian-get-vault-path', async () => (await readConfig()).vaultPath ?? null)

  ipcMain.handle('obsidian-set-vault-path', async (_event, p: string) => {
    await writeConfig({ vaultPath: p })
  })

  ipcMain.handle('obsidian-sync-file', async (_event, relPath: string, content: string) => {
    const { vaultPath } = await readConfig()
    if (!vaultPath) throw new Error('Vault パスが設定されていません')
    const target = path.join(vaultPath, '3ColorApp', relPath)
    await fs.mkdir(path.dirname(target), { recursive: true })
    await fs.writeFile(target, content, 'utf8')
    await appendLog({ time: new Date().toISOString(), message: `書き出し: ${relPath}`, success: true })
  })

  ipcMain.handle(
    'obsidian-sync-all',
    async (_event, files: Array<{ path: string; content: string }>) => {
      const { vaultPath } = await readConfig()
      if (!vaultPath) throw new Error('Vault パスが設定されていません')
      let written = 0
      for (const f of files) {
        try {
          const target = path.join(vaultPath, '3ColorApp', f.path)
          await fs.mkdir(path.dirname(target), { recursive: true })
          await fs.writeFile(target, f.content, 'utf8')
          written++
        } catch (err) {
          await appendLog({
            time: new Date().toISOString(),
            message: `失敗: ${f.path} - ${err instanceof Error ? err.message : String(err)}`,
            success: false,
          })
        }
      }
      await appendLog({
        time: new Date().toISOString(),
        message: `一括同期: ${written}/${files.length} 件成功`,
        success: written === files.length,
      })
      return { written }
    },
  )

  ipcMain.handle('obsidian-get-sync-log', async () => readLog())
}
