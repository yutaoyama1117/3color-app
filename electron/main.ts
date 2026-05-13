import { app, BrowserWindow, ipcMain, dialog, globalShortcut, Menu, Tray, Notification, nativeImage } from 'electron'
import path from 'node:path'
import { registerFileSystemHandlers } from './ipc-handlers/file-system'
import { registerObsidianSyncHandlers } from './ipc-handlers/obsidian-sync'
import { buildMenu } from './ipc-handlers/menu'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

const isDev = process.env.NODE_ENV === 'development'
// 環境変数 APP_URL で上書き可能（開発中の Next.js ポート指定用）
const APP_URL =
  process.env.APP_URL ?? (isDev ? 'http://localhost:3001' : 'https://3color.example.com')

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: '3Color - 読書メモ',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.loadURL(APP_URL)

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function createTray() {
  // __dirname は electron/dist/ なので、プロジェクトルートまで2階層上がる
  const iconPath = path.join(__dirname, '../../public/icons/icon-192.png')
  let icon = nativeImage.createFromPath(iconPath)
  if (icon.isEmpty()) {
    // フォールバック: 空の透明画像（トレイは表示されないが、クラッシュは防ぐ）
    console.warn('トレイアイコン未検出:', iconPath)
    icon = nativeImage.createEmpty()
  } else {
    icon = icon.resize({ width: 18, height: 18 })
  }
  try {
    tray = new Tray(icon)
    tray.setToolTip('3Color')
  } catch (err) {
    console.warn('トレイ作成失敗:', err)
    return
  }

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'アプリを開く',
      click: () => mainWindow?.show(),
    },
    {
      label: '新規登録',
      click: () => mainWindow?.loadURL(`${APP_URL}/app/register`),
    },
    { type: 'separator' },
    { label: '終了', click: () => app.quit() },
  ])
  tray?.setContextMenu(contextMenu)

  tray?.on('click', () => {
    if (mainWindow?.isVisible()) mainWindow.hide()
    else mainWindow?.show()
  })
}

function registerGlobalShortcuts() {
  globalShortcut.register('CommandOrControl+Shift+3', () => {
    if (mainWindow?.isVisible()) mainWindow.hide()
    else mainWindow?.show()
  })

  globalShortcut.register('CommandOrControl+Shift+N', () => {
    mainWindow?.show()
    mainWindow?.loadURL(`${APP_URL}/app/register`)
  })
}

app.whenReady().then(() => {
  createMainWindow()
  createTray()
  registerGlobalShortcuts()
  Menu.setApplicationMenu(buildMenu(mainWindow))

  registerFileSystemHandlers(ipcMain, dialog)
  registerObsidianSyncHandlers(ipcMain)

  // ジョブ完了通知（IPC経由）
  ipcMain.on('notify', (_event, options: { title: string; body: string }) => {
    new Notification(options).show()
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})
