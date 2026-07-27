> [!IMPORTANT]
> **Human review needed.** AI-generated; not yet confirmed by a human.

# Changelog

All notable changes to this project will be documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.0.1] - 2026-07-27

### Added

- `front_app_follows_mouse` config option — cursor focus follows the active application on switch; post-keypress hooks hoisted into the mode dispatch to support it
- Hot-reload settings with live-reload (no restart required) and a Settings UI panel
- `is_auto_snap` — keyboard motions snap the cursor to its grid-cell center while a number band is visible
- User-overridable theming system: `[theme.*]` blocks in `settings.toml` expose per-property knobs (hex colors, font family/size/weight/design, padding, corner radius, opacity, 9-point anchors with offsets, materials) for all UI elements — grid, numbers overlay, command-line, marks/register menus, help dialog, visual highlight, toast, and key-cast; hardcoded appearance literals removed from all overlays; missing `[theme.*]` blocks fall back to prior defaults transparently
- TOML schema (`schema/settings.schema.json`) extended to validate all theme keys (hex pattern, allowed font weights/designs, 9 anchor positions, 7 material flavors) with `additionalProperties: false` per subsection; full `configuration` section added with `mode_on_start` constrained to `ConfigMode` enum values; `commands.available.items.enum` expanded to all 24 `Config.Command` cases
- `.app` bundle shipped in the release tarball — required for `LaunchServices` to read `CFBundleIdentifier` from `Info.plist` and register the status item
- `flake.nix` `installPhase` places `neomouse.app` under `$out/Applications/` and symlinks the inner binary to `$out/bin/neomouse` so `nix run` / `nix profile add` get a working menu-bar item
- Auto-deploy bundled default `settings.toml` on first launch (`deployBundledDefaultsIfMissing()`): writes to `~/.config/neomouse/settings.toml` only when no file exists; never overwrites user config; no-ops silently under bare `swift run`
- Input Monitoring permission prompted via `IOHIDRequestAccess(kIOHIDRequestTypeListenEvent)` alongside the existing Accessibility prompt on first launch
- Default-on file logging to `~/Library/Logs/neomouse/neomouse.log` for bundled installs (`LOG=0`/`false` opts out; `LOG_LOCATION` overrides path; bare `swift run` unchanged)
- Menu-bar Diagnostics section: "Show Debug Log" and "Reveal Log in Finder" items pointing at the active log file
- `just release-local` recipe and `DRY_RUN=1` flag in `release.sh` — full release pipeline without any remote-touching step (no tag, push, `gh release`, tap bump, or flake bump)
- `just release-test` recipe — installs local-release tarball to `/Applications/NeoMouseTest.app` with a distinct bundle ID (`com.kangazero.NeoMouseTest`) so TCC permissions persist across rebuilds
- `just init` recipe — creates `~/.config/neomouse/` and copies the repo-root `settings.toml` (overwrites intentionally for reset-to-defaults workflow)
- `Info.plist` at repo root (`com.kangazero.neomouse`, `LSUIElement=true`) shared across dev (`just run`) and release tooling
- International keyboard layout support: layout-aware key-code → char map (`keyCodeToCharMap.swift`) with ASCII-capable Latin fallback for IME / non-Latin input sources (Cyrillic, Greek, Hebrew, Arabic, Thai, Pinyin, Hangul); `KeyCodeMap` class with `NSLock`-protected live rebuild on `kTISNotifySelectedKeyboardInputSourceChanged`; mark/register names intentionally kept on `event.characters` for native-script naming
- Mode-colored menu-bar status icon with full dropdown menu
- Register numbered-cycle: Vim-style `"1`–`"9` FIFO ring wired to the pasteboard watcher; `autoRegisterToNumeralsCurrentPasteboardItem` fill-first-empty alternative
- `specialFind` mode with `CursorSurroundedGridOverlay`; `q`/`w`/`e`/`r` keys for ±10 px nudges via `CGWarpMouseCursorPosition`; zoom integration for `specialFind` when macOS Accessibility Zoom is active
- `|` — jump-to-column-N keybind; `Zoom.isCurrentlyZoomed` / `currentZoomFactor` / `zoomIn` / `zoomOut` helpers
- `RegisterMenu` — Pasty-style card view for browsing and selecting named registers
- `:restart` command in command-line mode; `System.restart()` helper in `neomouseUtils/actions/system.swift` shared by menu-bar and command-line call sites
- Multi-display navigation via `Ctrl+w+hjkl`
- `H`/`J`/`K`/`L` scroll and `Gesture.scroll`; `NeomouseType.Direction`
- Marks menu; `Mark.set` updates an existing entry when start/end points and `isVisual` match
- `ggvG` / `ggyG` operations; `O` in visual mode moves cursor to the opposite x-axis edge; `gv` — go-to-previous visual state
- `cursorline` / `cursorcolumn` overlays
- Snap-cursor keybind (`s`) — snaps cursor x/y to the NumbersOverlay grid
- Fuzzy command-line suggestions (dropdown navigable with `Ctrl+N` / `Ctrl+P` / `Shift+Tab`); command execution and search are case-insensitive
- `KeyCodeMapTests` — 13 new tests across 3 suites (asciiChar contract, `charToKeyCodeMap` invariants, non-Latin layout fallback via `TISCreateInputSourceList`)
- `Screen.adjacentDisplayRectByDirection` tests — 5×5 pure-function grid suite
- CI: `taplo check settings.toml` validation step on the `macos-15` runner
- Tiered git hooks: conditional TOML config check in pre-commit; release-build gate in pre-push
- Universal macOS build (arm64 + x86_64); CI validates both architectures; Homebrew tap updated to serve both
- `CLAUDE.md` — module map, build/release conventions, current status, and open issues
- Nix devShell (`nix develop` / direnv `.envrc`) providing `just`, `taplo`, `shellcheck`, `actionlint`, `nixfmt`, `statix`, `deadnix` as the canonical developer toolchain
- `AI_POLICY.md` — project AI usage policy
- `REVIEW.md` + `just review` recipe — whole-app review checklist
- `man/neomouse.1` — man page

### Changed

- License: PolyForm Noncommercial 1.0.0 → MIT → GPL-3.0 (net at 0.0.1: GPL-3.0)
- Release tarball now contains `neomouse.app` bundle instead of a bare binary
- `rangeX` / `rangeY` config keys renamed to `rowsOnScreen` / `columnsOnScreen`; both accept `"automatic"` to derive the cell count from screen dimensions
- Global mouse monitor (`NSEvent.addGlobalMonitorForEvents`) made conditional on visual-mode entry via a Combine sink on `appState.$isVisual`; previously always-on at app init
- `settings.toml` shipped as a complete reference (all ~80 theme fields filled in with built-in defaults; delete any line to revert that field); previously a sparse starter file
- `offsetX`/`offsetY` renamed to `xOffset`/`yOffset` (`x_offset`/`y_offset` in TOML) across `CommandLineTheme`, `ToastTheme`, `KeyCastTheme`
- CI: `actions/checkout` v4 → v5 → v7; `nix-installer-action` pinned to a specific revision
- `flake.nix` modernized to the `finalAttrs` pattern; `formatter` and `checks` outputs added
- `GRDB.swift` 7.10.0 → 7.11.1
- `TOMLDecoder` 0.4.4 → 0.4.5

### Fixed

- CI pipeline build file location
- TOML integer literals (e.g. `width = 420`) no longer crash `TOMLDecoder` when the target type is `Double`; both `100` and `100.0` are now accepted in all 40 `Double` decoder sites in the theme model
- `MenuBarExtra` status-item dropdown was unresponsive — root cause: unconditional `NSEvent.addGlobalMonitorForEvents(.mouseMoved, .leftMouseDragged)` at app init silently blocks `MenuBarExtra` mouse-down events in `LSUIElement` (`.accessory`) apps; fixed by making the monitor conditional on visual mode
- Menu-bar status item was absent under `just run` — fixed by assembling a `.app` bundle for the dev binary; bare `swift run` without a bundle causes `CFBundleIdentifier=NULL` via `lsappinfo`
- Restart from a bundled `.app` install failed with "could not locate `Package.swift`"; `System.restart()` now uses `open <bundle-url>` when `Bundle.main.bundleIdentifier` is set
- Input Monitoring permission not prompted on first launch alongside Accessibility; key-down tap created successfully without it but the callback never fired, making neomouse appear dead
- `settings.toml` missing `configuration.mode_on_start` (a non-optional field on `Config.Configuration`) caused silent fallback to built-in defaults on every startup for all users
- `schema/settings.schema.json` was invalid JSON (C-style `//` comments, unclosed property block in the `visual` section) — `taplo check` failed to load the schema entirely; full rewrite to valid JSON
- `Screen.adjacentDisplayRectByDirection` — orthogonal-axis overlap check and correct rect lookup; broken on setups with 3 or more displays
- `MotionTarget` coord math aligned with `NumbersOverlay` (cell-center + both insets)
- Mouse, gesture, and clipboard event synthesis broken under macOS Accessibility Zoom — switched all `.cghidEventTap` posts to `.cgSessionEventTap` and paired cursor moves with `CGWarpMouseCursorPosition`
- Pasteboard yank race condition and event-tap duplicate events on restart
- Screenshot capture now works across non-primary displays (was limited to the main display)
- `ggvG` / `gv` (go-to-previous visual state) operation logic
- `moveRelative` returned early when the cursor was at the absolute bottom of the main screen; now falls back to the main screen bounds

### Removed

- Bare binary from the release tarball (superseded by `.app` bundle)
- `mise.toml` — superseded by the Nix devShell + direnv `.envrc`

---

## [0.0.0] - 2026-05-11

Initial public release. Vim-style keyboard-driven mouse controller for macOS 14+.

- Core Vim motions: `hjkl` with counts, `g`/`G` top/bottom jumps, visual mode selection, `gg`/`GG`, `o`/`O` edge moves
- CGEventTap key interception system with mode dispatch (normal, visual, command, menu)
- Overlays: `NumbersOverlay` (`:numbers` / `:relativenumbers`), marks overlay, register overlay, `HelpDialog` (`?`)
- Command-line mode (`:`) with fuzzy search and tab-cycling suggestions
- Register system: named registers, yank/paste/delete via simulated `Cmd+C`/`V`/`X`; persistent storage via GRDB.swift
- Marks: set, go-to, go-to-with-exact-visual-state; persistent across sessions
- Jump history and session tracking via GRDB.swift
- TOML configuration (`settings.toml`) decoded with TOMLDecoder; JSON schema at `schema/settings.schema.json` for `taplo` validation
- Modular Swift package: `neomouseConfig`, `neomouseUtils`, `neomouseTypes`, `neomouseDB` library targets
- Homebrew tap (`KangaZero/homebrew-neomouse`) and Nix flake distribution
- GitHub Actions CI (build, lint, tests)
- Release automation (`scripts/release.sh`) with Homebrew formula and `flake.nix` auto-bump
- `justfile` replacing Makefile; `mise.toml` pinning `just` per-project
- File logging via `LOG` / `LOG_LOCATION` env vars
- PolyForm Noncommercial 1.0.0 license
