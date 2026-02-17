# Screenpipe Repository Guidelines

## 適用範囲と優先順位
- このファイルは `02_projects/screenpipe` 専用ルールを定義する。
- 共通ルールは `../AGENTS.md`、ワークスペース方針は `../../AGENTS.md` を参照する。
- ルール衝突時はこのファイルを優先する。

## リポジトリ構成
- `crates/`: Rustワークスペース（コア機能、OCR、音声、サーバーなど）。
- `apps/screenpipe-app-tauri/`: Tauri デスクトップアプリ（Next.js + TypeScript）。
- `packages/`: CLI、SDK、関連パッケージ群。
- `docs/`, `TESTING.md`, `.github/workflows/`: 仕様、回帰観点、CI定義。

## 開発・検証コマンド
リポジトリルート:
- `cargo build --release`（macOS GPU最適化時は `--features metal` を検討）。
- `cargo test`
- `cargo fmt --all -- --check`
- `cargo clippy --workspace --exclude screenpipe-vision --exclude screenpipe-audio --all-targets -- -W clippy::all`

`apps/screenpipe-app-tauri`:
- `bun install`
- `bun run dev`（`localhost:1420`）
- `bun run test`
- `bun run test:e2e`

## コーディング規約
- Rust は `rustfmt` と `clippy` を前提にする。
- TypeScript/React は既存コンポーネント構成と命名に合わせる。
- 影響の大きい変更（window/tray/dock/monitor/audio）は小さな差分に分割する。

## テスト方針
- PR前に最低 `cargo test` と変更領域の追加検証を実施する。
- UI、ウィンドウ制御、録画挙動に触れた場合は `TESTING.md` の該当チェックリストを実施し、結果をPRに記録する。
- 破壊的変更（DB、録画パイプライン、アップデータ）は再現手順とロールバック手順を必ず残す。

## コミットとPR
- 既存履歴に合わせて `fix: ...`, `update: ...`, `chore: ...` などの短い形式を使う。
- PRタイトルに Issue 番号を含めない（必要なら本文で参照）。
- UI変更はスクリーンショットまたは短い動画を添付する。
- バイナリ生成物、`target/`、`node_modules/`、秘密情報はコミットしない。
