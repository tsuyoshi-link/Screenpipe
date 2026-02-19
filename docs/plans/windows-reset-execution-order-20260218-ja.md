# Windows Reset Execution Order (2026-02-18)

## 目的
- 現在の起動安定状態を基準に、テスト・ガイド・Git運用を再構築するための最小実行順を固定する。

## 現在の前提
- 実行バイナリ: `C:\t\release\screenpipe-app.exe`
- 起動判定: `:3030` LISTEN / `:11435` LISTEN / `http://127.0.0.1:3030/health = 200`
- `http://127.0.0.1:11435/health = 404` は既知挙動（失敗扱いにしない）

## 実行順（固定）
1. L0再確認（Path/Port/Health）
2. L1手動スモーク（Alt+S / Alt+K / Settings/Pipes / Alt+L）
3. 新ユーザーガイド草案作成（旧ガイドは参照資料）
4. Git差分整理（不要差分の切り分け、次ブランチ方針の固定）

## ドキュメント参照優先順位
1. `01_tickets/active/TK-20260218-004-screenpipe-reset-test-guide-git.md`
2. `02_projects/screenpipe/AGENTS.md`
3. `01_tickets/done/TK-20260218-003-screenpipe-restart-handover-master.md`
4. 既存 user-guide/test-plan（過去版、参照のみ）

## Git運用の当面ルール
- 作業開始時: `git status` / `git diff --name-only`
- 区切りごと: 変更意図が1つか確認（混ざったら分離）
- コミット前: テスト結果をチケットへ先に記録
- 今回は「再構築フェーズ」なので、ガイド更新と実装変更は同一コミットに混ぜない
