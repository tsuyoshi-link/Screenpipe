# Screenpipe Repo Guidelines

## Scope and Priority
- This file defines repository-specific rules for `02_projects/screenpipe`.
- Priority: `02_projects/screenpipe/AGENTS.md` > `02_projects/AGENTS.md` > `Workspace/AGENTS.md`.
- Git/commit/push timing rules are managed in `02_projects/AGENTS.md` to avoid duplication.

## Git Branch Model (Single-Repo Product Mode)
- This repository is operated in a single-repo model for product development.
- Remotes:
  - `origin`: `tsuyoshi-link/Screenpipe` (working remote)
  - `upstream`: `screenpipe/screenpipe` (source of upstream updates)
- Branch roles:
  - `sync/main`: upstream sync branch. Keep this branch as upstream-following only; do not add product-specific commits.
  - `product/main`: product mainline for your app (`Screenpipe + customizations`).
  - `feature/*`: day-to-day work branches, always created from `product/main`.
- Sync flow (standard):
  1. `git fetch upstream`
  2. `git switch sync/main`
  3. `git merge --ff-only upstream/main`
  4. `git push origin sync/main`
  5. `git switch product/main`
  6. `git merge sync/main`
  7. Resolve conflicts, run tests, then push `product/main`
- Guardrails:
  - Do not merge `product/main` back into `sync/main`.
  - Do not use `main` for active development in this repo context (legacy snapshot line).

## Repository Layout (top-level)
- `apps/`: Application entrypoints. Main target for Windows exe is `apps/screenpipe-app-tauri`.
- `crates/`: Rust workspace crates used by app/runtime.
- `packages/`: JS/TS packages.
- `docs/`: User/dev documents.
- `scripts/`: Helper scripts for build/dev ops.
- `.cargo/`: Cargo config overrides.
- `target/`, `.target-main-build/`: Build artifacts/cache (do not use as source of truth).

## Canonical Build Target (Windows exe)
- Build target app: `apps/screenpipe-app-tauri/src-tauri`.
- Final binary of interest: `screenpipe-app.exe` (Tauri app).
- Runtime validation endpoints:
  - `http://127.0.0.1:3030/health` should return `200` when app is healthy.
  - `127.0.0.1:11435` may listen even when `/health` is `404` (this alone is not failure).
  - `localhost:1420` is dev UI server; do not treat as required for production exe.

## Development Policy (Important)
- Do NOT build `.exe` for every small change.
- Default loop for day-to-day development is:
  1. run app in dev mode (`tauri dev`),
  2. run targeted tests (`bun test`, `cargo test` / `cargo check`),
  3. do a full Windows `.exe` build only at release checkpoints.
- Treat full `.exe` builds as expensive validation, not as the default feedback loop.

## Hard Stop: Windows Rust Command Preflight (Mandatory)
- Scope: any Rust command on Windows in this repo (`cargo check`, `cargo test`, `cargo build`), not only EXE rebuild.
- Before running, always set:
  - `CARGO_TARGET_DIR` to a short path (recommended: `C:\t\target` or `C:\t\target-<task>`).
  - `CARGO_BUILD_JOBS=1..3` when low-load mode is required.
- Do not run Rust commands against default nested `target` paths under `apps/screenpipe-app-tauri/src-tauri` on Windows.
- Failure mode this prevents:
  - MSBuild/CMake path-length failures (including `MSB3491` and whisper/CMake try-compile errors with path length 260).
- Standard command shape:
  - ``$env:CARGO_TARGET_DIR='C:\t\target-check'; $env:CARGO_BUILD_JOBS='1'; cargo check --manifest-path apps/screenpipe-app-tauri/src-tauri/Cargo.toml``

## Recommended Test/Build Levels
Use the lightest level that proves the change.

### Level 1: UI iteration (default)
- Purpose: quick UI/interaction checks during coding.
- Commands (from `apps/screenpipe-app-tauri`):
  - `bun run predev` (only if dependencies/assets are missing or after clean)
  - `bunx tauri dev`
- Notes:
  - This is the standard path for most UI fixes.
  - Hot reload + dev runtime is the fastest feedback loop.

### Level 2: Local automated checks (per commit)
- Purpose: catch regressions without packaging.
- Commands:
  - JS/TS tests: `bun test` (or `bun run test`)
  - Rust checks/tests (targeted first): `cargo check --manifest-path apps/screenpipe-app-tauri/src-tauri/Cargo.toml`
  - Rust tests when relevant: `cargo test` (scope to changed crate when possible)
- Notes:
  - Prefer targeted checks over full-workspace heavy runs unless change impact is broad.

### Level 3: Release-like binary without installer (optional)
- Purpose: performance/runtime sanity closer to release, faster than full bundle.
- Command (from repo root):
  - `cargo build --profile release-dev --target x86_64-pc-windows-msvc --manifest-path apps/screenpipe-app-tauri/src-tauri/Cargo.toml`
- Notes:
  - Use before full packaging when medium confidence is needed.

### Level 4: Full Windows `.exe`/installer build (checkpoint only)
- Purpose: distribution validation (NSIS/updater/resources/signing flow).
- Run this only when one of these is true:
  - release candidate/tag preparation,
  - CI/release workflow verification,
  - installer/updater/resource packaging changed,
  - versioning/release config changed (`tauri.prod.conf.json`, windows bundle settings).

## High-Value Files To Check Before EXE Rebuild
- `CLAUDE.md`
  - JS/TS package manager policy is `bun` (not pnpm/npm for repo work).
- `apps/screenpipe-app-tauri/scripts/pre_build.js`
  - Windows dependencies (`wget`, ffmpeg, bun binary copy) are prepared here.
- `apps/screenpipe-app-tauri/src-tauri/Cargo.toml`
  - App version, Rust profile settings, feature flags (`official-build` etc.).
- `.cargo/config.toml`
  - Default `[build] jobs = 16`; this can violate local CPU-limit requirements.
  - Always override with env (`CARGO_BUILD_JOBS`) for low-load operation.
- `apps/screenpipe-app-tauri/src-tauri/tauri.conf.json`
  - Dev-oriented defaults (`screenpipe - Development`, dev URL).
- `apps/screenpipe-app-tauri/src-tauri/tauri.prod.conf.json`
  - Production release identity/config (`screenpipe`, updater enabled).
- `apps/screenpipe-app-tauri/src-tauri/tauri.windows.conf.json`
  - Windows NSIS/resource bundling config (external bin/resources).
- `.github/workflows/release-app.yml`
  - Canonical CI release behavior for Windows (short target dir/junction, long-path handling, prod config swap).

## Windows Command Cookbook
- Workdir: `apps/screenpipe-app-tauri` for app/frontend commands.
- Dev UI + Tauri runtime:
  - `bunx tauri dev`
- JS tests:
  - `bun test`
- Rust app check:
  - `cargo check --manifest-path src-tauri/Cargo.toml`
- Fast release-like app binary:
  - `cargo build --profile release-dev --target x86_64-pc-windows-msvc --manifest-path src-tauri/Cargo.toml`
- Full distribution build (checkpoint only):
  - `bun run prebuild`
  - `bunx tauri build --target x86_64-pc-windows-msvc --features official-build`

## Fastest Stable Path To Rebuild EXE (based on ticket history)
1. Stop existing heavy/conflicting processes before build:
   - `screenpipe-app`, `cargo`, `rustc`, stale `bun/next` dev processes.
2. Use low-load settings first:
   - `CARGO_BUILD_JOBS=1..3`
   - process priority `BelowNormal` at start.
3. Avoid Windows path-length failure (`MSB3491`) by shortening target dir:
   - set `CARGO_TARGET_DIR` to short path (example: `C:\t\target` or another short local path).
   - if needed, use CI-style short path/junction strategy from `release-app.yml`.
4. Run prebuild from `apps/screenpipe-app-tauri`:
   - `bun run prebuild`
   - Ensure `wget` is discoverable (history shows failures if PATH misses winget/Program Files locations).
5. Build exe:
   - Preferred low-risk path used successfully in tickets:
   - `cargo build --release --target x86_64-pc-windows-msvc --manifest-path src-tauri\Cargo.toml`
6. Validate runtime, not only build success:
   - start exe and check `:3030`, `:11435`, and `3030/health=200`.
   - confirm app does not depend on `:1420` for production flow.
7. If release-like identity/updater behavior is required:
   - use production config (`tauri.prod.conf.json`) instead of dev config before bundling.

## When Full EXE Build Is NOT Required
- UI text/layout/style changes.
- Frontend state/interaction changes with no installer/resource changes.
- Rust logic changes already validated by unit/integration tests and `tauri dev`.
- Bugfix verification that can be reproduced in dev runtime.

## When Full EXE Build IS Required
- Changes in:
  - `apps/screenpipe-app-tauri/src-tauri/tauri.windows.conf.json`
  - `apps/screenpipe-app-tauri/src-tauri/tauri.prod.conf.json`
  - `apps/screenpipe-app-tauri/scripts/pre_build.js`
  - updater/signing/version/release pipeline behavior.
- Any issue that reproduces only in packaged app context.

## Known Failure Patterns And Guardrails
- `pre_build.js` fails with `wget not found`:
  - Check `where wget` and PATH before retrying.
- `tauri build` or whisper/CMake fails with long-path (`MSB3491`):
  - Immediately switch to short `CARGO_TARGET_DIR`.
- `cargo build` fails early with `os error 32` on `.rcgu.o` remove:
  - Prefer `CARGO_TARGET_DIR=%LOCALAPPDATA%\Temp\sp-target-*` over workspace-local target dirs.
  - Retry with fresh temp target dir before changing code.
- `screenpipe-audio/build.rs` download fails due proxy (`127.0.0.1:9`) or TLS credential errors:
  - Clear proxy env for build shell (`ALL_PROXY`/`HTTP_PROXY`/`HTTPS_PROXY` and git proxy vars).
  - Reuse local ONNX runtime under `apps/screenpipe-app-tauri/src-tauri/onnxruntime-win-x64-gpu-1.19.2` when available.
- `3030` never comes up and stderr shows `ORT API` mismatch (example: requested `[19]`, available `[1, 17]`):
  - Treat as runtime DLL version mismatch, not API logic regression.
  - Do not deploy `screenpipe-app.exe` alone. Sync runtime set together: `onnxruntime*.dll` (from `.../onnxruntime-win-x64-gpu-1.19.2/lib`), `vcredist/*.dll`, and `src-tauri/assets` into the run directory (e.g. `C:\t\release`).
  - Re-check `:3030` LISTEN and `http://127.0.0.1:3030/health=200` before running WDIO.
- Confusion between dev and prod:
  - `:1420` is for dev UI (`bun run dev`/Next.js), not a production exe requirement.
- Startup panic `PluginInitialization("http", "... os error 5")`:
  - Treat as runtime environment/permission issue; separate from build pipeline.
  - Verify reproducibility with direct exe launch and preserve logs before changing code.

## CPU/Load Policy During Build
- Default policy for this repo on this machine:
  - Start at `BelowNormal` priority and `CARGO_BUILD_JOBS=1..3`.
  - If total CPU is too high, stop non-essential app processes first (`screenpipe-app` etc.).
  - `.cargo/config.toml` defaults to 16 jobs; explicit env override is mandatory when load control is required.
  - Raise priority/jobs only after user confirmation.
- For long builds, preserve logs under `01_tickets/artifacts/tickets/<ticket-id>/<run-ts>/` (do not write build logs to `01_tickets/active/`).

## Build-Time Reduction Rules (Mandatory)
- Do not run `clean` unless there is a concrete cache-corruption reason.
- Reuse persistent `CARGO_TARGET_DIR` across iterative builds.
- On Windows, keep `CARGO_TARGET_DIR` short (example: `C:\t\target`) to avoid long-path failures and rebuild churn.
- Prefer Level 1/2/3 flow above; Level 4 is exception path.
- If build time regresses notably, record root cause and mitigation in ticket Work Log.

## Ticket And Evidence Rules (Repo Work)
- Every major build/rebuild must leave:
  - command summary,
  - output path,
  - runtime validation result,
  - blocker/fix notes.
- Canonical record is `01_tickets` Work Log, not ad-hoc chat memory.

## Windows EXE Artifact Tracking (Mandatory)
- Keep runtime execution path fixed at `C:\t\release\screenpipe-app.exe` for WDIO and handoff consistency.
- For every rebuilt or re-copied exe, also create a timestamped artifact copy with:
  - `screenpipe-app-YYYYMMDD-HHMMSS-<profile>-<branch>-<commit8>.exe`
- Before considering the artifact usable, sync runtime set to the same directory:
  - `onnxruntime*.dll` (from `apps/screenpipe-app-tauri/src-tauri/onnxruntime-win-x64-gpu-1.19.2/lib`)
  - `vcredist/*.dll`
  - `apps/screenpipe-app-tauri/src-tauri/assets/*`
- Register each artifact in:
  - `01_tickets/screenpipe-windows-exe-registry.md`
- Minimum registry fields:
  - build command/profile, source commit, sha256, runtime sync status, `3030/health` result, latest `core/extended` E2E summary.

## Current Reset Anchor (2026-02-18)
- Quick resume playbook:
  - `01_tickets/screenpipe-ops-playbook.md`
- Execution dashboard:
  - `01_tickets/screenpipe-execution-dashboard.md`
- Execution anchor ticket:
  - `01_tickets/active/TK-20260218-004-screenpipe-reset-test-guide-git.md`
- Repo-side execution memo:
  - `docs/plans/windows-reset-execution-order-20260218-ja.md`
 - UI test handoff:
   - `docs/plans/windows-ui-test-handoff-20260218-ja.md`
   - `docs/plans/windows-ui-test-coverage-matrix-20260218-ja.md`
 - Beginner full test plan:
   - `docs/plans/windows-complete-test-plan-beginner-20260218-ja.md`

## Minimal Preflight Checklist Before Any EXE Rebuild
- Correct repo/branch confirmed (`02_projects/screenpipe`).
- `git status` checked for unexpected diffs.
- Existing `screenpipe-app` process state checked and controlled.
- `wget` detection confirmed.
- Short `CARGO_TARGET_DIR` set.
- CPU guard settings (`CARGO_BUILD_JOBS`, priority) set.

## Post-Reboot Validation Rule
- If a reboot is used for recovery, always verify process identity before further debugging:
  - `Get-Process screenpipe-app | Select Id,Path,StartTime`
  - Confirm `Path` is the intended binary (typically `C:\t\release\screenpipe-app.exe`).
  - Re-check runtime (`:3030`, `:11435`, `3030/health`) before concluding environment issue is resolved.
