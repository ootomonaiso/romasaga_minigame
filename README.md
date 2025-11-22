# Romancing SaGa 3 Trade Mini Game

React 19 + TypeScript + Vite で構築したロマサガ3の「買収劇」リメイクです。物件データ、グループ技、交渉技を実装し、買収ミニゲームをブラウザ上で再現しています。

## 開発コマンド

| コマンド | 説明 |
| --- | --- |
| `npm run dev` | Vite 開発サーバー (http://localhost:5173) |
| `npm run build` | 型チェック + 本番ビルド (`dist/`) |
| `npm run preview` | ビルド済み成果物のローカル確認 |

## GitHub Pages へのデプロイ

GitHub Actions Workflow (`.github/workflows/deploy.yml`) で自動ビルドと公開を行います。

1. **リポジトリ設定**
   - GitHub > Repository > *Settings* > *Pages*
   - "Source" を **GitHub Actions** に設定

2. **ブランチに push する**
   - `main` ブランチへの push、または手動の *Run workflow* でビルドが開始
   - Vite の `base` は `GITHUB_PAGES` 環境変数に合わせて `/romasaga_minigame/` に自動設定されます

3. **URL の確認**
   - Actions の `Deploy to GitHub Pages` ジョブが完了すると、Pages URL が表示されます
   - 例: `https://ootomonaiso.github.io/romasaga_minigame/`

### ワークフローの内容

- Node.js 20 で `npm ci` → `npm run build`
- `dist/` を `actions/upload-pages-artifact` で保存
- `actions/deploy-pages` で GitHub Pages に公開

リポジトリ名を変更した際は `vite.config.ts` 内の `repositoryName` を同じ値に更新してください。
