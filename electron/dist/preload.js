"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
/**
 * Renderer プロセスから安全に呼び出せる API。
 * window.electronAPI で公開される。
 */
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // ファイルシステム
    selectFolder: () => electron_1.ipcRenderer.invoke('select-folder'),
    writeFile: (filePath, content) => electron_1.ipcRenderer.invoke('write-file', filePath, content),
    readSettings: () => electron_1.ipcRenderer.invoke('read-settings'),
    saveSettings: (settings) => electron_1.ipcRenderer.invoke('save-settings', settings),
    // Obsidian 同期
    obsidianSyncFile: (relPath, content) => electron_1.ipcRenderer.invoke('obsidian-sync-file', relPath, content),
    obsidianSyncAll: (files) => electron_1.ipcRenderer.invoke('obsidian-sync-all', files),
    obsidianGetVaultPath: () => electron_1.ipcRenderer.invoke('obsidian-get-vault-path'),
    obsidianSetVaultPath: (path) => electron_1.ipcRenderer.invoke('obsidian-set-vault-path', path),
    obsidianGetSyncLog: () => electron_1.ipcRenderer.invoke('obsidian-get-sync-log'),
    // 通知
    notify: (options) => electron_1.ipcRenderer.send('notify', options),
    // プラットフォーム
    platform: process.platform,
    isElectron: true,
});
