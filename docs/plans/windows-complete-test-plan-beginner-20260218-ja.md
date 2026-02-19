# Screenpipe 完全網羅テスト計画書（初心者向け / 2026-02-18）

## この計画書の目的
- 後続の改修で不具合が出たときに、原因を素早く切り分けできる状態を作る。
- テスト経験が浅くても「何を、どの順で、どう判定するか」がわかるようにする。
- 別AIへそのまま実行委譲できるように、コマンドと期待結果を固定化する。

## まず用語を整理（超重要）
- 単体テスト（Unit Test）:
  - 小さい関数/コンポーネント単位のテスト。
  - 例: ReactコンポーネントやHookの振る舞い検証。
- 結合テスト（Integration Test）:
  - 複数モジュールを組み合わせた挙動を確認。
  - 例: UIからローカルAPIを叩いたときの連携確認。
- 総合テスト（System Test）:
  - アプリ全体が要件どおり動くかを確認。
  - 例: 起動→設定→検索→表示までの一連動作。
- E2Eテスト:
  - ユーザー操作に近い形で、実アプリを起動して端から端まで確認。
  - 例: Tauriアプリ実行 + UI遷移 + API疎通 + エラー有無確認。

## Screenpipe の既存テストツール（Windows）
- `Vitest`:
  - 用途: 単体/軽い結合テスト（TS/TSX）。
  - 定義: `apps/screenpipe-app-tauri/vitest.config.ts`
  - コマンド: `bun run test`
- `WebdriverIO (WDIO) + Tauri Driver`:
  - 用途: E2E/UI回帰テスト。
  - 定義: `apps/screenpipe-app-tauri/wdio*.conf.js`
  - コマンド:
    - `bun run test:e2e:core`（日常TDD用）
    - `bun run test:e2e:extended`（リリース前広範囲）
    - `bun run test:e2e:spec -- ./e2e/tests/<file>.js`（単体spec）
- 手動スモーク:
  - 用途: 自動化しきれない実機挙動確認（ホットキー、見た目、権限回り）。
  - 参照: `TESTING.md` と本計画書の「手動必須項目」。

## 実行順（これを固定）
1. L0（環境健全性）
2. 単体テスト（Vitest）
3. E2E Core（最低回帰）
4. E2E Extended（網羅回帰）
5. 手動必須項目（自動化外）
6. 結果集約（判定と差分記録）

## L0: 環境健全性チェック（必須）
- 実行前条件:
  - 対象exeが明確（例: `C:\t\release\screenpipe-app.exe`）
  - 実行プロセスのPath確認済み
  - `:3030` / `:11435` / `3030/health` の状態を確認
- 判定:
  - `3030/health=200` をPASS基準
  - `11435/health=404` は既知挙動（FAIL扱いしない）

## 単体テスト計画（Vitest）
- コマンド:
  - `Set-Location 02_projects/screenpipe/apps/screenpipe-app-tauri`
  - `bun run test`
- 主目的:
  - Reactコンポーネント、Hook、ロジックの破壊検出
- FAIL時の切り分け:
  - 失敗テスト名
  - 対象ファイル
  - 期待値/実値の差

## E2Eテスト計画（WDIO）
- 定義ファイル:
  - `apps/screenpipe-app-tauri/wdio.core.conf.js`
  - `apps/screenpipe-app-tauri/wdio.extended.conf.js`
  - `apps/screenpipe-app-tauri/e2e/test-suite-manifest.json`

### E2E Core（毎回）
- コマンド:
  - `bun run test:e2e:core`
- 対象:
  - health-check / app-lifecycle / search-api / settings-navigation / settings-persistence / onboarding-flow
- 意味:
  - 「改修直後に最低限壊れていない」を保証するセット

### E2E Extended（網羅）
- コマンド:
  - `bun run test:e2e:extended`
- 対象:
  - Core + timeline-navigation + window-overlay + websocket-performance + timeline-performance + db-stress + mcp-integration
- 意味:
  - 回帰漏れを最小化する広範囲セット

## 手動必須項目（自動化外）
- グローバルショートカット:
  - `Alt+S`, `Alt+K`, `Alt+L`
- 画面導線:
  - Settings > Pipes
- 体感品質:
  - クラッシュ無し、主要導線での操作継続可

## TESTING.md との関係（網羅観点）
- `TESTING.md` は回帰観点の母集団（1〜16セクション）。
- そのうち Windows 現フェーズで優先するのは:
  - 8 App lifecycle
  - 9 Database/storage
  - 10 Settings
  - 11 Onboarding
  - 12 Timeline/search
  - 14 Windows-specific
  - 16 MCP/Claude integration
- macOS専用観点（1,2,6,7の大部分）は Windows 実行対象外として別管理。

## 結果記録フォーマット（初心者向け固定）
- 記録先:
  - `01_tickets/active/TK-20260218-004-screenpipe-reset-test-guide-git.md`
- 1行フォーマット:
  - `YYYY-MM-DD HH:MM | owner | [test-id] command | PASS/FAIL/BLOCKED | 要約`
- 例:
  - `2026-02-18 15:10 | Codex | [E2E-CORE] bun run test:e2e:core | PASS | 6 specs passed`

## 判定ルール（最終）
- PASS:
  - L0 + Vitest + E2E Core + 手動必須項目 がすべて通過
- CONDITIONAL PASS:
  - Extended のみ一部失敗（既知環境要因）で、チケットに根拠付き記録あり
- FAIL:
  - Core失敗、または手動必須項目でクラッシュ/導線不通
- BLOCKED:
  - 環境依存（権限・ドライバ・ネットワーク制約）で実行不能

## 別AIへの委譲テンプレ
- 依頼文に必ず含める:
  1. 対象ブランチ/コミット
  2. 実行スコープ（Coreのみ / Core+Extended）
  3. 結果記録先ファイル
  4. FAIL時の再実行回数（通常1回）
  5. 証跡要件（ログ/動画/スクショ）

## 今回の補助資料
- `docs/plans/windows-ui-test-handoff-20260218-ja.md`
- `docs/plans/windows-ui-test-coverage-matrix-20260218-ja.md`
- `apps/screenpipe-app-tauri/e2e/test-suite-manifest.json`
