"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const node_path_1 = __importDefault(require("node:path"));
const file_system_1 = require("./ipc-handlers/file-system");
const obsidian_sync_1 = require("./ipc-handlers/obsidian-sync");
const menu_1 = require("./ipc-handlers/menu");
let mainWindow = null;
let tray = null;
const isDev = process.env.NODE_ENV === 'development';
// 環境変数 APP_URL で上書き可能（開発中の Next.js ポート指定用）
const APP_URL = process.env.APP_URL ?? (isDev ? 'http://localhost:3001' : 'https://3color.example.com');
function createMainWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        title: '3Color - 読書メモ',
        webPreferences: {
            preload: node_path_1.default.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });
    mainWindow.loadURL(APP_URL);
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
function createTray() {
    // __dirname は electron/dist/ なので、プロジェクトルートまで2階層上がる
    const iconPath = node_path_1.default.join(__dirname, '../../public/icons/icon-192.png');
    let icon = electron_1.nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) {
        // フォールバック: 空の透明画像（トレイは表示されないが、クラッシュは防ぐ）
        console.warn('トレイアイコン未検出:', iconPath);
        icon = electron_1.nativeImage.createEmpty();
    }
    else {
        icon = icon.resize({ width: 18, height: 18 });
    }
    try {
        tray = new electron_1.Tray(icon);
        tray.setToolTip('3Color');
    }
    catch (err) {
        console.warn('トレイ作成失敗:', err);
        return;
    }
    const contextMenu = electron_1.Menu.buildFromTemplate([
        {
            label: 'アプリを開く',
            click: () => mainWindow?.show(),
        },
        {
            label: '新規登録',
            click: () => mainWindow?.loadURL(`${APP_URL}/app/register`),
        },
        { type: 'separator' },
        { label: '終了', click: () => electron_1.app.quit() },
    ]);
    tray?.setContextMenu(contextMenu);
    tray?.on('click', () => {
        if (mainWindow?.isVisible())
            mainWindow.hide();
        else
            mainWindow?.show();
    });
}
function registerGlobalShortcuts() {
    electron_1.globalShortcut.register('CommandOrControl+Shift+3', () => {
        if (mainWindow?.isVisible())
            mainWindow.hide();
        else
            mainWindow?.show();
    });
    electron_1.globalShortcut.register('CommandOrControl+Shift+N', () => {
        mainWindow?.show();
        mainWindow?.loadURL(`${APP_URL}/app/register`);
    });
}
electron_1.app.whenReady().then(() => {
    createMainWindow();
    createTray();
    registerGlobalShortcuts();
    electron_1.Menu.setApplicationMenu((0, menu_1.buildMenu)(mainWindow));
    (0, file_system_1.registerFileSystemHandlers)(electron_1.ipcMain, electron_1.dialog);
    (0, obsidian_sync_1.registerObsidianSyncHandlers)(electron_1.ipcMain);
    // ジョブ完了通知（IPC経由）
    electron_1.ipcMain.on('notify', (_event, options) => {
        new electron_1.Notification(options).show();
    });
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            createMainWindow();
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
electron_1.app.on('will-quit', () => {
    electron_1.globalShortcut.unregisterAll();
});
