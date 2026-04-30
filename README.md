# こうかんにっき

家族向けの交換日記アプリです。  
Next.js 16 / React 19 / Supabase を使っていて、LINE Login で本人確認し、LINE公式アカウントから投稿通知を送れる構成にしています。

## 主な機能

- LINE Login によるログイン
- 日記の投稿、編集、削除
- 絵文字リアクション
- LINE公式アカウントを友だち追加済みユーザーへの投稿通知

## 開発サーバー

```bash
npm run dev
```

`http://localhost:3000` を開いて確認します。

## 必要な環境変数

`.env.example` をコピーして `.env.local` を作成してください。

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
LINE_CHANNEL_ID=
LINE_CHANNEL_SECRET=
LINE_REDIRECT_URI=http://localhost:3000/api/auth/line/callback
LINE_MESSAGING_CHANNEL_ACCESS_TOKEN=
LINE_SESSION_SECRET=
```

## Supabase 側の追加設定

`users` テーブルに LINE 用のカラムを追加します。

```sql
\i supabase/line-auth.sql
```

最低限、既存の `users` / `entries` / `likes` テーブルはそのまま使います。

## LINE 側の前提

- LINE Login チャネルと Messaging API チャネルを同じ Provider 配下に作る
- LINE公式アカウントを Messaging API と連携する
- LINE Login の callback URL に `LINE_REDIRECT_URI` を登録する
- LINE Login の add friend option を使うため、ログイン時に公式アカウントの友だち追加を許可する

LINE の user ID は、同じ Provider 配下なら LINE Login と Messaging API で共通です。  
その前提で、ログインした user ID に対して通知を送っています。

## 現在の実装メモ

- 認証は Supabase Auth ではなく、LINE Login + アプリ側 Cookie セッションです
- データ保存はまだ Supabase を利用しています
- 通知は「新規投稿時」に送るようにしています
- 既存スキーマに合わせるため、投稿者識別は現時点では `author_name` / `user_name` を使っています

## 次にやるとよいこと

- `entries` と `likes` を `user_id` 基準に移行する
- LINE webhook を受けて friendship status を同期する
- 画像アップロードもサーバー経由に統一する
- Supabase の RLS を見直して公開範囲を調整する
