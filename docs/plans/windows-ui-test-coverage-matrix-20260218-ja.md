# Screenpipe UIテスト カバレッジマトリクス（2026-02-18）

## 方針
- `core` は「日常TDD用の最小完全系」。
- `extended` は「回帰漏れを抑える広範囲系」。

## Core（毎回）
- 起動/ライフサイクル
  - `e2e/tests/health-check.js`
  - `e2e/tests/app-lifecycle.js`
- API/検索
  - `e2e/tests/search-api.js`
- 設定画面の基本導線
  - `e2e/tests/settings-navigation.js`
  - `e2e/tests/settings-persistence.js`
- 初回導線
  - `e2e/tests/onboarding-flow.js`

## Extended（リリース前）
- タイムライン導線/負荷
  - `e2e/tests/timeline-navigation.js`
  - `e2e/tests/timeline-performance.js`
- 通信/イベント負荷
  - `e2e/tests/websocket-performance.js`
  - `e2e/tests/db-stress.js`
- 表示オーバーレイ
  - `e2e/tests/window-overlay.js`
- 外部連携
  - `e2e/tests/mcp-integration.js`

## 手動確認（現時点で自動化外）
- グローバルホットキー実動作:
  - `Alt+S`, `Alt+K`, `Alt+L`
- 実機UIの最終見た目確認（ガイド用スクリーンショット）
- 再起動後の自己復旧確認（Path/Port/Health）

## 実行結果（2026-02-18）
- 実行条件:
  - `SCREENPIPE_E2E_APP_PATH=C:\t\release\screenpipe-app.exe`
  - `ALL_PROXY/HTTP_PROXY/HTTPS_PROXY/GIT_HTTP_PROXY/GIT_HTTPS_PROXY` を空で実行
- `core`:
  - `e2e/tests/health-check.js`: PASS
  - `e2e/tests/search-api.js`: PASS
  - `e2e/tests/settings-navigation.js`: PASS
  - `e2e/tests/settings-persistence.js`: PASS
  - `e2e/tests/app-lifecycle.js`: FAIL（`should not have XSS in search results` で `/search` が 500）
  - `e2e/tests/onboarding-flow.js`: PASS（既存プロファイル環境を許容する判定へ調整後）
- `extended`:
  - PASS:
    - `e2e/tests/health-check.js`
    - `e2e/tests/search-api.js`
    - `e2e/tests/settings-navigation.js`
    - `e2e/tests/settings-persistence.js`
    - `e2e/tests/onboarding-flow.js`
    - `e2e/tests/db-stress.js`
  - FAIL:
    - `e2e/tests/app-lifecycle.js`（`S9.5` XSS検索で `/search` が 500）
    - `e2e/tests/timeline-navigation.js`（`S9.5` 特殊文字検索で `/search` が 500）
    - `e2e/tests/window-overlay.js`（document title が空文字）
    - `e2e/tests/timeline-performance.js`（timeline container が出現しない）
    - `e2e/tests/mcp-integration.js`（`pipe 'list' not found`）
  - SKIPPED:
    - `e2e/tests/websocket-performance.js`（WDIO実行では spec として評価されず）
