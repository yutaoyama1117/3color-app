# 3Color iOS アプリ 仕様

> Phase 3-3 の SwiftUI 実装で参照するための仕様書。

## 1. API 仕様

### 認証
- **方式**: Supabase Auth JWT (Bearer token)
- **iOS SDK**: [supabase-swift](https://github.com/supabase-community/supabase-swift)
- **トークン保管**: iOS Keychain（App Group で Share Extension とも共有）
- **自動リフレッシュ**: `AuthManager.refreshIfNeeded()` を全API呼び出し前に実行

### エンドポイント一覧

| Method | Path | 用途 |
|---|---|---|
| GET | `/api/v1/contents` | コンテンツ一覧 |
| POST | `/api/v1/contents` | コンテンツ作成 |
| **POST** | **`/api/v1/contents/quick`** | **Share Extension 用クイック登録** |
| GET | `/api/v1/contents/:id` | コンテンツ詳細 |
| PATCH | `/api/v1/contents/:id` | コンテンツ更新 |
| DELETE | `/api/v1/contents/:id` | コンテンツ削除 |
| GET | `/api/v1/marks?content_id=` | マーク一覧 |
| POST | `/api/v1/marks` | マーク作成 |
| PATCH | `/api/v1/marks/:id` | マーク更新 |
| DELETE | `/api/v1/marks/:id` | マーク削除 |
| **GET** | **`/api/v1/sync/changes?since=`** | **差分同期取得** |
| **POST** | **`/api/v1/sync/push`** | **クライアント変更プッシュ** |
| POST | `/api/v1/uploads/presign` | 画像/ファイル presigned URL |
| POST | `/api/v1/contents/:id/summary/generate` | AI要約生成 |
| GET | `/api/v1/marks/:id/related` | 関連マーク取得 |
| POST | `/api/v1/review/:mark_id` | 復習結果記録（Phase 3-5） |
| GET | `/api/v1/review/today` | 今日の復習カード（Phase 3-5） |

## 2. Share Extension データフロー

```
他アプリ → 共有ボタン → Share Extension
  ├→ URL共有  → POST /api/v1/contents/quick { source: "share_extension", type: "web", url }
  ├→ テキスト → POST /api/v1/contents/quick { source: "share_extension", type: "book", text, title }
  └→ 画像     → POST /api/v1/uploads/presign → 画像PUT → ocr ジョブ enqueue
完了 → ローカル通知「登録しました」→ 元アプリに戻る
```

### 認証情報の共有
- Bundle ID: `com.example.3color`（メインアプリ）
- Share Extension Bundle ID: `com.example.3color.ShareExtension`
- App Group: `group.com.example.3color`
- Keychain Access Group: `$(AppIdentifierPrefix)group.com.example.3color`

メインアプリでログイン後、`AuthManager` が access_token / refresh_token を Keychain に保存し、Share Extension からも読み取り可能にする。

## 3. 同期設計

### タイミング
| イベント | 同期内容 |
|---|---|
| アプリ起動時 | pull 全差分 |
| フォアグラウンド復帰 | pull 増分 |
| 30秒ごと（フォアグラウンド時） | pull 増分 |
| ローカル変更時 | 即時 push（オンライン時） / キュー登録（オフライン時） |
| バックグラウンドフェッチ（最短15分） | push + pull |

### 初回起動
```
GET /api/v1/sync/changes?since=1970-01-01T00:00:00Z&limit=1000
→ ページング: response.sync_cursor を次の since に
```

### 通常同期（プル）
```
GET /api/v1/sync/changes?since={lastSyncCursor}
→ レスポンスの created/updated/deleted を SwiftData に反映
→ sync_cursor を保存
```

### 通常同期（プッシュ）
```
POST /api/v1/sync/push
{
  operations: [
    { entity: "marks", action: "create", client_id: "local_xxx", data: {...}, client_timestamp: "..." }
  ]
}
→ レスポンスの client_id ↔ server_id 対応で SwiftData の id を上書き
→ status === "conflict" の場合は server_version で上書き、ユーザーに通知
```

## 4. SwiftData ローカルDB

サーバーDB と同一スキーマ + 以下を追加:

```swift
@Model class Content {
  // ... サーバーDB と同等のフィールド
  var syncStatus: SyncStatus  // .synced | .pendingCreate | .pendingUpdate | .pendingDelete
  var localId: String         // クライアント側仮ID（同期前）
  var lastSyncedAt: Date?
}
```

### 同期ステータス
| 値 | 意味 |
|---|---|
| `synced` | サーバーと一致 |
| `pendingCreate` | ローカル作成済み、サーバー未送信 |
| `pendingUpdate` | サーバーIDあり、変更あり |
| `pendingDelete` | 削除予定 |

### 競合解決
- 基本: **last-write-wins**（client_timestamp と server.updated_at を比較）
- サーバー側が新しい場合: server_version を返却 → クライアントで強制上書き + ユーザー通知

## 5. オフライン対応

### ローカル動作可能な機能
- 既存コンテンツ・マークの閲覧
- マークの作成・編集・削除（同期キューに保存）
- AI要約のキャッシュ表示（再生成は不可）

### オンライン時のみ可能
- URL/PDF/音声の取り込み（外部API依存）
- AI要約生成
- 関連マーク検索

## 6. プッシュ通知（APNs）

| 通知 | タイミング |
|---|---|
| ジョブ完了 | コンテンツ取得・AI要約完了時 |
| 復習リマインダー | 設定した時刻（デフォルト朝8時） |
| 関連メモ提案 | 新規マークの Embedding 生成完了で類似マークが見つかった時 |

設定: `Settings > 通知` で各種類別にON/OFF切替可能。

## 7. ウィジェット

### Small
- ランダム復習マーク 1件 + 色

### Medium
- 今日の復習カード件数 + 直近のマーク 3件

### TimelinePolicy
- `atEnd`: 表示後に Provider が次のマークをフェッチ
- API: `GET /api/v1/review/today?limit=1`

## 8. Haptic Feedback

| イベント | フィードバック |
|---|---|
| マーク作成 | `.impact(.light)` |
| マーク削除 | `.notification(.warning)` |
| 復習カード切替 | `.selection` |
| エラー | `.notification(.error)` |
| 同期完了 | `.notification(.success)` |
