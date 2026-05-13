import type { IpcMain, Dialog } from 'electron'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const SETTINGS_PATH = path.join(os.homedir(), '.3color-app', 'settings.json')

/** ファイルシステム IPC ハンドラ群を登録 */
export function registerFileSystemHandlers(ipcMain: IpcMain, dialog: Dialog) {
  ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  ipcMain.handle('write-file', async (_event, filePath: string, content: string) => {
    const dir = path.dirname(filePath)
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(filePath, content, 'utf8')
  })

  ipcMain.handle('read-settings', async () => {
    try {
      const data = await fs.readFile(SETTINGS_PATH, 'utf8')
      return JSON.parse(data)
    } catch {
      return {}
    }
  })

  ipcMain.handle('save-settings', async (_event, settings: Record<string, unknown>) => {
    await fs.mkdir(path.dirname(SETTINGS_PATH), { recursive: true })
    await fs.writeFile(SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf8')
  })
}
