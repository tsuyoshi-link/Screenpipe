# Screenpipe Windows配布・導入 最短化プレイブック

最終更新: 2026-02-17
対象: `02_projects/screenpipe`（Desktop App / Tauri / Windows）

## 1. 目的

改修版を販売・配布するときに、毎回 source build で詰まらず、最短で「ビルド -> 検証 -> 導入」できる運用を固定する。

## 2. 結論（最重要）

- 導入先PCでは **絶対に source build しない**（NSIS installer 配布のみ）。
- source build は Build PC（またはCI）に限定する。
- 通常リリースは `.github/workflows/release-app.yml` を正とし、Windows artifact（`.exe` / `.nsis.zip` / `.sig`）を配布する。
- ローカル `tauri dev` は「開発確認専用」。販売版は `official-build` 付き release build を使う。

## 3. 役割分離（時間短縮の本体）

- Build lane: CI または専用 Build PC で installer 生成
- QA lane: クリーンWindows検証PCで installer 動作確認
- Deploy lane: 顧客PCへ installer 配布・導入

この3レーンを分離すると、顧客PCでのセットアップは数分で完了する。

## 4. 一度だけやる Build PC 初期構築

PowerShell（管理者）で実行:

```powershell
winget install -e --id Microsoft.VisualStudio.2022.BuildTools --accept-source-agreements --accept-package-agreements
winget install -e --id LLVM.LLVM --accept-source-agreements --accept-package-agreements --silent --disable-interactivity
winget install -e --id Kitware.CMake --accept-source-agreements --accept-package-agreements --silent --disable-interactivity
winget install -e --id 7zip.7zip --accept-source-agreements --accept-package-agreements --silent --disable-interactivity
winget install -e --id JernejSimoncic.Wget --accept-source-agreements --accept-package-agreements --silent --disable-interactivity
```

確認:

```powershell
cl
clang --version
cmake --version
7z i
wget --version
bun --version
rustc -V
cargo -V
```

## 5. Build PC の固定化設定（再発防止）

### 5.1 短縮パス運用

長パス/ロック/PDB系エラーを避けるため、リポジトリと target を短縮する。

```powershell
New-Item -ItemType Directory -Force -Path C:\t | Out-Null
if (!(Test-Path C:\s)) {
  New-Item -ItemType Junction -Path C:\s -Target "C:\Users\TTT\Desktop\Workspace\02_projects\screenpipe" | Out-Null
}
```

### 5.2 セッション環境（ローカル開発確認時）

```powershell
$env:CARGO_TARGET_DIR = "C:\t"
$env:CARGO_BUILD_JOBS = "1"
$env:PATH = "C:\Program Files\7-Zip;C:\wget;" + $env:PATH
Set-Location C:\s\apps\screenpipe-app-tauri
```

補足:
- `CARGO_BUILD_JOBS=1` は速度より安定優先（初回確立用）。
- 安定後にCPU余力があれば `2..4` へ段階的に上げる。

### 5.3 容量監視

- 実行前に C ドライブ空き 60GB 以上を確保（`os error 112` 予防）。
- 不要な `target/debug` は定期的に掃除する。

## 6. 標準リリース手順（推奨: CI）

### 6.1 リリースビルド

1. バージョン更新（`apps/screenpipe-app-tauri/src-tauri/Cargo.toml`）。
2. GitHub Actions `release-app.yml` を実行（`workflow_dispatch` 可）。
3. workflow 内で production config が適用される:
   - `tauri.prod.conf.json -> tauri.conf.json`
   - Windows build args: `--target x86_64-pc-windows-msvc --features official-build`
4. 生成物を確認:
   - Windows: `*.exe`, `*.nsis.zip`, `*.sig`

参照:
- `.github/workflows/release-app.yml`
- `apps/screenpipe-app-tauri/src-tauri/tauri.prod.conf.json`
- `apps/screenpipe-app-tauri/src-tauri/tauri.windows.conf.json`

### 6.2 配布パッケージ

顧客向け配布物は以下に固定:

- インストーラー本体（NSIS `.exe`）
- SHA256（改ざん検知）
- リリースノート（既知制約・権限案内含む）

## 7. CI不可時のローカル緊急ビルド手順

`C:\s\apps\screenpipe-app-tauri` で実行:

```powershell
bun install

# 開発確認（watch再ビルドループ回避）
bun run tauri dev --release --no-watch
```

販売版をローカル生成する場合（緊急時のみ）:

```powershell
Copy-Item .\src-tauri\tauri.prod.conf.json .\src-tauri\tauri.conf.json -Force

$env:RUSTFLAGS = "-C target-feature=+crt-static -C link-arg=/LTCG"
$env:KNF_STATIC_CRT = "1"
$env:CMAKE_ARGS = "-DGGML_NATIVE=OFF -DGGML_AVX512=OFF -DGGML_AVX512_VBMI=OFF -DGGML_AVX512_VNNI=OFF -DGGML_AVX512_BF16=OFF"

bunx tauri build --target x86_64-pc-windows-msvc --features mkl,official-build
```

出力先:

`apps/screenpipe-app-tauri/src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis/`

## 8. 導入先PC（顧客PC）手順

1. 配布された NSIS `.exe` を実行してインストール。
2. 初回起動後に以下を確認:
   - アプリ起動できる
   - 録画/権限画面に到達できる
   - Windows Defender でブロックされない
3. ログ確認:
   - `%USERPROFILE%\.screenpipe\screenpipe-app.YYYY-MM-DD.log`

重要:
- 顧客PCでは Build Tools/LLVM/CMake は不要（source buildしないため）。

## 9. トラブル即応表

### `ChunkLoadError`（Next.jsチャンク不整合）

```powershell
# tauri/next を停止後
Remove-Item -Recurse -Force .\apps\screenpipe-app-tauri\.next
Set-Location .\apps\screenpipe-app-tauri
bun run dev
```

その後 `http://localhost:1420` を一度開いてチャンクを生成してから Tauri を起動する。

### `LNK2038`（MT/MDランタイム不一致）

- Windows release系の runtime 条件を合わせる（`KNF_STATIC_CRT=1` + release build）。
- Debug build で再発しやすいので、Windowsは原則 release 検証を使う。

### `LNK1318`（PDB制約/ロック）

- 短縮パス（`C:\s` / `C:\t`）で再実行。
- 不要プロセス停止後に再ビルド。

### `os error 112`（空き容量不足）

- `target/debug` を削除し、空き60GB以上で再実行。

### Defender高負荷（Build時）

- 初回大量コンパイル時は一時的に高負荷になり得る。
- Build専用PCでは `C:\t` の除外設定を検討可（セキュリティ方針に従う）。
- 顧客PCへの除外設定は原則不要。

## 10. 毎リリースの最小チェック（10分版）

1. `release-app.yml` の Windows artifact が揃っている。
2. クリーン検証PCで installer 新規インストール -> 起動。
3. ログに致命エラーがない。
4. チケットに「生成物」「検証結果」「既知制約」を1行ずつ残す。

## 11. この手順の運用先

- 実装手順の正本: このファイル
- 実行ログの正本: `01_tickets/*` の `Work Log`
- 回帰観点: `TESTING.md`
