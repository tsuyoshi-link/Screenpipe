# Screenpipe UIテスト実行ハンドオフ（2026-02-18）

## 目的
- 別AI/別担当でも同じ手順で UI テストを実行できるようにする。
- TDDの入口として `core` スイートを固定し、バグ修正時の再現性を上げる。

## 対象
- リポジトリ: `02_projects/screenpipe`
- アプリ: `apps/screenpipe-app-tauri`
- テスト基盤: WebdriverIO + Tauri Driver

## スイート定義
- 機械可読定義:
  - `apps/screenpipe-app-tauri/e2e/test-suite-manifest.json`
- 実行設定:
  - `apps/screenpipe-app-tauri/wdio.core.conf.js`
  - `apps/screenpipe-app-tauri/wdio.extended.conf.js`

## 実行前チェック（必須）
1. `tauri-driver` が存在すること  
2. `screenpipe-app.exe` が `wdio.conf.js` の探索パスにあること  
3. Windowsでアプリ起動後 `http://127.0.0.1:3030/health` が到達可能であること  
4. 実行ディレクトリが `apps/screenpipe-app-tauri` であること  

## 実行コマンド
```powershell
Set-Location C:\Users\TTT\Desktop\Workspace\02_projects\screenpipe\apps\screenpipe-app-tauri

# TDDで最初に回す（推奨）
bun run test:e2e:core

# リリース前の広範囲確認
bun run test:e2e:extended

# 単体spec（バグ修正中）
bun run test:e2e:spec -- ./e2e/tests/search-api.js
```

## テスト結果の記録先
- 主要ログ: `01_tickets/active/TK-20260218-004-screenpipe-reset-test-guide-git.md` の Work Log
- 動画証跡: `apps/screenpipe-app-tauri/e2e/videos/`
- 失敗時の最小記録:
  - 失敗 spec 名
  - 失敗ステップ（selector/API/timeout）
  - 再現コマンド

## 失敗時の切り分け手順
1. アプリ起動確認: `Get-Process screenpipe-app | Select Id,Path`
2. API確認: `Invoke-WebRequest http://127.0.0.1:3030/health`
3. spec単体実行で再現性確認
4. 失敗が環境依存なら `FAIL（環境）` として記録

## TDD運用ルール
- バグ修正は必ず以下順:
1. 失敗する spec を固定
2. 最小修正
3. 同 spec 再実行
4. `core` 再実行
- 仕様変更を伴う場合は、該当 spec の期待値更新理由を Work Log に残す。
