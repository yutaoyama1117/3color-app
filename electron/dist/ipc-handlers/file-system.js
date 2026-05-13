"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerFileSystemHandlers = registerFileSystemHandlers;
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
const node_os_1 = __importDefault(require("node:os"));
const SETTINGS_PATH = node_path_1.default.join(node_os_1.default.homedir(), '.3color-app', 'settings.json');
/** ファイルシステム IPC ハンドラ群を登録 */
function registerFileSystemHandlers(ipcMain, dialog) {
    ipcMain.handle('select-folder', async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openDirectory'],
        });
        if (result.canceled || result.filePaths.length === 0)
            return null;
        return result.filePaths[0];
    });
    ipcMain.handle('write-file', async (_event, filePath, content) => {
        const dir = node_path_1.default.dirname(filePath);
        await node_fs_1.promises.mkdir(dir, { recursive: true });
        await node_fs_1.promises.writeFile(filePath, content, 'utf8');
    });
    ipcMain.handle('read-settings', async () => {
        try {
            const data = await node_fs_1.promises.readFile(SETTINGS_PATH, 'utf8');
            return JSON.parse(data);
        }
        catch {
            return {};
        }
    });
    ipcMain.handle('save-settings', async (_event, settings) => {
        await node_fs_1.promises.mkdir(node_path_1.default.dirname(SETTINGS_PATH), { recursive: true });
        await node_fs_1.promises.writeFile(SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf8');
    });
}
