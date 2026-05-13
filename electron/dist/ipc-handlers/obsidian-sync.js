"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerObsidianSyncHandlers = registerObsidianSyncHandlers;
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
const node_os_1 = __importDefault(require("node:os"));
const CONFIG_PATH = node_path_1.default.join(node_os_1.default.homedir(), '.3color-app', 'obsidian.json');
const LOG_PATH = node_path_1.default.join(node_os_1.default.homedir(), '.3color-app', 'sync-log.json');
const MAX_LOG_ENTRIES = 50;
async function readConfig() {
    try {
        return JSON.parse(await node_fs_1.promises.readFile(CONFIG_PATH, 'utf8'));
    }
    catch {
        return {};
    }
}
async function writeConfig(cfg) {
    await node_fs_1.promises.mkdir(node_path_1.default.dirname(CONFIG_PATH), { recursive: true });
    await node_fs_1.promises.writeFile(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf8');
}
async function readLog() {
    try {
        return JSON.parse(await node_fs_1.promises.readFile(LOG_PATH, 'utf8'));
    }
    catch {
        return [];
    }
}
async function appendLog(entry) {
    const log = await readLog();
    log.unshift(entry);
    await node_fs_1.promises.mkdir(node_path_1.default.dirname(LOG_PATH), { recursive: true });
    await node_fs_1.promises.writeFile(LOG_PATH, JSON.stringify(log.slice(0, MAX_LOG_ENTRIES), null, 2), 'utf8');
}
function registerObsidianSyncHandlers(ipcMain) {
    ipcMain.handle('obsidian-get-vault-path', async () => (await readConfig()).vaultPath ?? null);
    ipcMain.handle('obsidian-set-vault-path', async (_event, p) => {
        await writeConfig({ vaultPath: p });
    });
    ipcMain.handle('obsidian-sync-file', async (_event, relPath, content) => {
        const { vaultPath } = await readConfig();
        if (!vaultPath)
            throw new Error('Vault パスが設定されていません');
        const target = node_path_1.default.join(vaultPath, '3ColorApp', relPath);
        await node_fs_1.promises.mkdir(node_path_1.default.dirname(target), { recursive: true });
        await node_fs_1.promises.writeFile(target, content, 'utf8');
        await appendLog({ time: new Date().toISOString(), message: `書き出し: ${relPath}`, success: true });
    });
    ipcMain.handle('obsidian-sync-all', async (_event, files) => {
        const { vaultPath } = await readConfig();
        if (!vaultPath)
            throw new Error('Vault パスが設定されていません');
        let written = 0;
        for (const f of files) {
            try {
                const target = node_path_1.default.join(vaultPath, '3ColorApp', f.path);
                await node_fs_1.promises.mkdir(node_path_1.default.dirname(target), { recursive: true });
                await node_fs_1.promises.writeFile(target, f.content, 'utf8');
                written++;
            }
            catch (err) {
                await appendLog({
                    time: new Date().toISOString(),
                    message: `失敗: ${f.path} - ${err instanceof Error ? err.message : String(err)}`,
                    success: false,
                });
            }
        }
        await appendLog({
            time: new Date().toISOString(),
            message: `一括同期: ${written}/${files.length} 件成功`,
            success: written === files.length,
        });
        return { written };
    });
    ipcMain.handle('obsidian-get-sync-log', async () => readLog());
}
