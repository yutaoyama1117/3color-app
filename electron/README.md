# 3Color Electron Desktop App

Next.js Web版をラップした macOS デスクトップアプリ。

## セットアップ
```bash
# Electron + electron-builder を追加（package.json に既にスクリプトあり）
npm install --save-dev electron electron-builder

# Electron 用 TypeScript ビルド
npx tsc -p electron/tsconfig.json
```

## 開発実行
```bash
# 別ターミナルで Next.js dev を起動
npm run dev

# Electron 起動
npm run electron:dev
```

## ビルド（DMG）
```bash
npm run electron:build
# → dist-electron/ に DMG が生成される
```

## ファイル構成
```
electron/
├── main.ts                ← メインプロセス
├── preload.ts             ← contextBridge で API 公開
├── ipc-handlers/
│   ├── file-system.ts     ← フォルダ選択、ファイル書き出し、設定保存
│   ├── obsidian-sync.ts   ← Vault 同期（Phase 3-6）
│   └── menu.ts            ← アプリケーションメニュー
└── tsconfig.json
```

## グローバルショートカット
| キー | 機能 |
|---|---|
| Cmd+Shift+3 | ウィンドウ表示/非表示 |
| Cmd+Shift+N | 新規登録画面を開く |
| Cmd+N | 新規登録（メニュー） |
| Cmd+E | エクスポート画面 |

## 注意
- Apple Developer ID 署名 + ノータリゼーションは別途実施が必要。
- 実機ビルドには Xcode Command Line Tools が必要。
