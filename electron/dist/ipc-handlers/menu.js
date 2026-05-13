"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildMenu = buildMenu;
const electron_1 = require("electron");
const APP_URL = process.env.APP_URL ??
    (process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://3color.example.com');
function buildMenu(mainWindow) {
    const template = [
        {
            label: 'ファイル',
            submenu: [
                {
                    label: '新規登録',
                    accelerator: 'CmdOrCtrl+N',
                    click: () => mainWindow?.loadURL(`${APP_URL}/app/register`),
                },
                {
                    label: 'エクスポート',
                    accelerator: 'CmdOrCtrl+E',
                    click: () => mainWindow?.loadURL(`${APP_URL}/app/settings/export`),
                },
                { type: 'separator' },
                { role: 'quit', label: '終了' },
            ],
        },
        {
            label: '編集',
            submenu: [
                { role: 'undo', label: '元に戻す' },
                { role: 'redo', label: 'やり直し' },
                { type: 'separator' },
                { role: 'cut', label: '切り取り' },
                { role: 'copy', label: 'コピー' },
                { role: 'paste', label: '貼り付け' },
            ],
        },
        {
            label: '表示',
            submenu: [
                {
                    label: 'ダッシュボード',
                    click: () => mainWindow?.loadURL(`${APP_URL}/app`),
                },
                {
                    label: '復習',
                    click: () => mainWindow?.loadURL(`${APP_URL}/app/review`),
                },
                { type: 'separator' },
                { role: 'reload', label: '再読み込み' },
                { role: 'toggleDevTools', label: '開発者ツール' },
            ],
        },
    ];
    return electron_1.Menu.buildFromTemplate(template);
}
