> [!IMPORTANT]
> **Human review needed.** AI-generated; not yet confirmed by a human.

# neomouse — reviewer's map

This document is a reviewer's map of the whole app: a module-by-module,
file-by-file checklist of what a human should verify before trusting the code.
neomouse is a menu-bar (LSUIElement / `.accessory`) macOS daemon that installs a
global `CGEventTap`, translates Vim motions into cursor moves / clicks / scrolls
/ gestures / clipboard ops, and persists sessions, marks, registers, jumps and
executed-operation telemetry through GRDB. It is a **five-target SwiftPM
package** whose dependencies point downward: `neomouse (exe) → neomouseDB →
neomouseUtils → neomouseTypes`, with `neomouseConfig` sitting beside
`neomouseDB` (both → Utils + Types).

Running `just review` (→ `scripts/review-markers.sh`) lists every file still
carrying the `> [!IMPORTANT]` AI-review marker at the top of this file, so
reviewers can see at a glance which parts of the tree have not yet been
human-confirmed. `just review-count` prints just the tally. Sign a file off by
removing its marker once reviewed.

Because most logic touches global system state (the event tap, the pasteboard,
ScreenCaptureKit, Accessibility), the highest-value review targets are: the tap
install/callback in `Input/KeyEventTap.swift`, the register/pasteboard
round-trip in `neomouseDB/models/Register.swift` + `Operations/CoreOperations.swift`,
the screenshot pipeline in `neomouseUtils/Screen/screenshot.swift`, the GRDB
layer under `neomouseDB`, and the TOML decode/validate/write path across
`neomouseConfig` + `UI/Settings/SettingsView.swift`.

Legend for callouts: **[BUG]** = a defect spotted during this pass that a
reviewer should confirm; **[SEC]** = a security/permissions/privacy concern;
**[TEST]** = a testing gap; **[ROUGH]** = a half-wired seam / scaffolding that
works but isn't finished.

---

## `neomouseTypes` — shared value types

Responsibility: pure, dependency-free value types shared by every other target
to avoid import cycles.

Files:
- `modes.swift` — `NeomouseType` namespace (`Mode`, `FindState`, `VisualState`,
  `NormalModePendingOperation`, `MenuWindow`, `ConfigMode`, `Direction`) plus the
  telemetry enums `ModeName`, `MotionOperationType`, `MouseOperationType`,
  `TrackpadOperationType`, `OperationName`, and the `ExecutedOperation` GRDB
  record. **Note:** despite the CLAUDE.md diagram, `ExecutedOperation` /
  `OperationName` / `ModeName` live in `neomouseTypes/modes.swift`, not
  `neomouseDB` — confirm this placement is intended (they carry a `GRDB` import
  and `DatabaseValueConvertible`/`FetchableRecord` conformances **inside the
  Types target**, which pulls GRDB into the supposedly dependency-free layer).
- `commandCategory.swift` — `CommandCategory` (`.motion/.visual/.register/.find/
  .gesture/.screen/.command/.ui/.global`), `String`-backed, `CaseIterable`.

Checklist:
- [ ] `Mode` is a non-`Equatable` enum with associated values
      (`normal(currentPendingOperation:operationCountAsString:)`,
      `find(currentPendingOperation:findState:isQuickFind:)`,
      `command(command:suggestionIndex:)`, `menu(window:)`, `specialFind`,
      `disabled`). Confirm nothing relies on `Mode` equality (dispatch uses
      `if case` / `switch`, which is fine).
- [ ] `NormalModePendingOperation` enumerates `none/g/gg/ggy/ggv/special/window/
      setMark/goToMark/goToMarkExactState/goToRegister/registerAction(register:)`.
      Verify every case is reachable and handled in `handleNormalMode` — dead
      cases are a maintenance trap. `setMacro`/`goToMacro` are commented out.
- [ ] Two overlapping direction enums: `NeomouseType.Direction`
      (`left/down/up/right`, `Decodable`) and `HJKLDirection` in Utils. Confirm
      the duplication (config-decodable vs pure motion helper) is intentional.
- [ ] `ConfigMode` (`disabled/normal/find/command/menu`) omits `specialFind` and
      `menu` has no launch-target — confirm `mode_on_start = "specialFind"` is
      genuinely unsupported and the schema/validator rejects it.
- [ ] The `NeomouseType` doc comment misspells the namespace as `NemouseType`
      (cosmetic).

---

## `neomouseUtils` — input / screen / pasteboard / gesture / zoom / screenshot / motion helpers

Responsibility: UI-light caseless-`enum` namespaces plus screenshot and
gated-logging helpers wrapping the low-level CoreGraphics / AppKit /
ScreenCaptureKit / Carbon APIs.

Files (regrouped per #4 — the old `old/`, `stringToInt.swift`, `validation.swift`,
`actions/`, `helpers/`, `dev/` folders are gone):
- `Mouse/mouse.swift`, `Mouse/gestures.swift`, `Mouse/postGestureEvent.swift`,
  `Mouse/zoom.swift`
- `Screen/screen.swift`, `Screen/screenshot.swift`, `Screen/window.swift`
- `System/pasteboard.swift`, `System/system.swift`
- `Keyboard/hjkl.swift`, `Keyboard/keyCodeToCharMap.swift`
- `Motion/motions.swift`
- `Support/debug.swift`

Checklist:
- [ ] **[SEC]** `Mouse/mouse.swift`: `Mouse.frontmostAppUnder()` reads
      `CGWindowListCopyWindowInfo` (bounds/PID/layer/alpha only, no titles → no
      Screen-Recording gate) and `setActiveApp(_:)` calls `app.activate()`.
      Confirm the guards (`.regular` policy, not-self, not-already-active)
      prevent focus-stealing loops and can't be pointed at a privileged app.
      This is the engine behind `front_app_follows_mouse`.
- [ ] `Mouse/mouse.swift`: `moveToGlobal` / `moveToScreenLocal` clamp to
      `Screen.allBoundingRect()`; verify the `bounds.isNull` degrade-to-passthrough
      branch (no active displays) and the warp-then-post-delta correctness under
      Accessibility Zoom. `click/down/up/drag/scroll` warp first — confirm any
      `usleep`/main-thread sleeps are acceptable.
- [ ] `Screen/screen.swift`: `adjacentDisplayRect` uses exact `==` on `CGFloat`
      edges. Verify real display layouts always produce pixel-exact touching
      edges (fractional scaling / mixed-DPI could break this — the tests use
      integer grids). Check the CG↔AppKit Y-flip for non-primary displays.
- [ ] **[SEC]** `Screen/screenshot.swift`: `captureMultiDisplay` captures screen
      pixels via ScreenCaptureKit (Screen Recording TCC). Confirm the
      `excluding:` window-ID list suppresses neomouse's own overlays, the
      `stitchImages` Y-flip math is correct for stacked displays, and that
      `isTCCError` matching `-3801` (`SCStreamErrorUserDeclined`) is still the
      right domain/code. `requestAccess()` prompts up-front. **(`isTCCError` is
      now unit-tested — see Tests.)**
- [ ] `System/pasteboard.swift`: `waitForChange(after:)` polls `changeCount`
      with a timeout and hands `nil` on timeout — confirm every caller logs-and-
      skips rather than writing stale content. Archive/unarchive use restricted
      class lists.
- [ ] `Mouse/zoom.swift`: drives macOS Accessibility Zoom via **deprecated**
      Carbon `UAZoom*` (import `Carbon`) and reads private
      `com.apple.universalaccess` prefs. Confirm this is the accepted canonical
      channel and that toggling degrades gracefully when the zoom shortcut is
      disabled.
- [ ] **[BUG-risk]** `Mouse/postGestureEvent.swift` + `Mouse/gestures.swift`:
      synthesize `kCGEventGesture` with **hard-coded private field numbers** and
      force-unwrap `CGEventType(rawValue: 29)!`. Undocumented private CGEvent
      fields — flag as fragile across macOS versions; the force-unwraps are
      crash sites if Apple ever changes the raw value.
- [ ] **[SEC]** `System/system.swift`: `System.simulate` tags synthesized
      Cmd-C/V/X with the `synthesizedEventUserData` sentinel ("NMOUSE").
      Confirm the sentinel pass-through in the tap callback can't be spoofed by
      another process to smuggle keystrokes. `restart()` spawns a shell — verify
      argv-passing defuses injection and the `swift run` dev branch is
      unreachable in a shipped bundle.
- [ ] `Motion/motions.swift`: `MotionTarget` math is pure and unit-tested. The
      `PendingOp`/`MotionIntent`/`reducePendingOp` reducer is a **spec that is
      NOT wired into the live handler** — confirm it isn't silently diverging
      from `handleNormalMode`.
- [ ] `Keyboard/keyCodeToCharMap.swift`: `KeyCodeMap` is `@unchecked Sendable`
      guarded by an `NSLock`, rebuilt on input-source change, with a forced-Latin
      fallback. Carbon TIS is not thread-safe (tests pin `@MainActor`) — verify
      production only touches it on the main actor.
- [ ] `Support/debug.swift`: env-gated logger. **[SEC]** confirm the default
      verbosity never logs full pasteboard contents (`Pasteboard.preview`
      truncates, but still logs clipboard text) and confirm the file-logging
      default and log path for bundled `.app` installs.

---

## `neomouseConfig` — TOML-backed runtime configuration

Responsibility: decode `settings.toml` into a `Config` value tree (deliberately
SwiftUI/AppKit-free) with strict unknown-key/enum validation and a nine-element
theme model.

Files (`theme.swift` split into a `Theme/` folder per #4):
- `config.swift` — `Config` + nested `Grid/Motion/AutoInt/Visual/Gesture/
  Commands/Command/Configuration`, `LoadError`, `resolvedURL`, `loadConfig`.
- `strictDecoding.swift` — `AnyCodingKey`, `validateKnownKeys`, `toSnakeCase`,
  `decodeFriendlyEnum`.
- `Theme/Theme.swift` — top-level `Config.Theme` container (nine sub-themes).
- `Theme/ElementThemes.swift` — the nine sub-theme structs (`GridTheme`,
  `NumbersOverlayTheme`, `CommandLineTheme`, `MarksMenuTheme`, `RegisterMenuTheme`,
  `HelpDialogTheme`, `VisualHighlightTheme`, `ToastTheme`, `KeyCastTheme`).
- `Theme/ThemePrimitives.swift` — `ThemeColor`, `ThemeFont` (+ `Weight`/`Design`),
  `ThemeAnchor`, `ThemeDirection`, `ThemeVerticalDirection`, `ThemeMaterial`.

Checklist:
- [ ] `config.swift`: resolution order is `$NEOMOUSE_CONFIG` →
      `~/.config/neomouse/settings.toml` → `~/Library/Application Support/
      neomouse/settings.toml`. Confirm `resolvedURL` returns `nil` (not a crash)
      when nothing exists and that `NeoMouseState` falls back to inline defaults.
      `loadConfig` uses typed throws (`throws(LoadError)`) — good.
- [ ] `Config.AutoInt` accepts an `Int` or the literal `"automatic"`. Confirm
      negative/zero integers can't reach the grid math — `resolvedGrid` clamps
      with `max(1, …)` and guards `baseline > 0` / `rowHeight > 0`, so verify no
      other consumer divides by a raw config value.
- [ ] `Configuration.init(from:)` calls `validateKnownKeys` then
      `decodeIfPresent ?? defaultX` for every field, with a `CaseIterable
      CodingKeys`. Verify each new key keeps a matching `defaultX` static so
      older files keep loading. `maxSessionCount` is `UInt` (0 accepted) —
      confirm 0 is handled downstream (session pruning).
- [ ] `strictDecoding.swift`: `validateKnownKeys` enumerates present keys via
      `AnyCodingKey` and rejects unknowns with a snake_case message;
      `decodeFriendlyEnum` overrides the generic enum error. **(Now unit-tested:
      unknown-key rejection + invalid-enum error — see Tests.)** Confirm
      `toSnakeCase` round-trips every real key.
- [ ] `Theme/ElementThemes.swift` (648 lines) + `ThemePrimitives.swift`: verify
      every sub-theme struct calls `validateKnownKeys`, every enum overrides its
      synthesized init with `decodeFriendlyEnum`, and `ThemeColor` hex parsing
      (`#rgb`/`#rgba`/`#rrggbb`/`#rrggbbaa`) rejects malformed input without
      crashing. **(`ThemeColor` hex parsing is now well unit-tested incl.
      shorthand + malformed fallback-to-black.)** A field-by-field three-way sync
      vs `schema/settings.schema.json` vs `settings.toml` is still warranted for
      the sub-theme fields not exercised by tests.

---

## `neomouseDB` — GRDB-backed persistence

Responsibility: a GRDB SQLite store for sessions, marks, registers, macros,
jumps, and executed-operation telemetry, plus the serial recorder feeding it.

Files:
- `AppDatabase.swift` — global `dbQueue`, `initializeDB`.
- `models/Session.swift`, `models/Mark.swift`, `models/Register.swift`,
  `models/Macro.swift`, `models/Jump.swift`, `models/ExecutedOperation.swift`
- `models/OperationName+Category.swift` — `OperationName.category` mapping.
- `models/OperationRecorder.swift` — `RecordedOperation` + `OperationRecorder`
  actor (added in #3).
- `models/dev/seed.swift` — `NEOMOUSE_SEED`-gated dev seeding.

Checklist:
- [ ] **[BUG] — STILL OPEN.** `AppDatabase.initializeDB`: the "already
      initialized?" guard still ANDs in `db.tableExists("macro")`, but the
      `db.create(table: "macro")` block is **commented out** (lines ~109-116).
      The macro table is therefore never created → `isTablesExist` is **always
      false → every launch DROPs and recreates every table**, wiping persisted
      data on each start. (The DB test suite even documents this — it excludes
      `Macro` because "the create(table:) block is commented out".) Fix: either
      create the macro table or drop it from the guard.
- [ ] **[BUG] — STILL OPEN.** `AppDatabase.swift`: `dbPath` lives in
      `FileManager.default.temporaryDirectory` — the OS purges it. Combined with
      the always-reinit above, there is effectively **no persistence across
      reboots**, and the new operation-telemetry recorder writes into a store
      that's wiped every launch. Verify this isn't the intended production path
      (Application Support is conventional).
- [ ] **[BUG]** No migration framework (`DatabaseMigrator`) — schema changes are
      destructive re-inits. Flag the absence; every real schema change today
      requires a full wipe.
- [ ] `AppDatabase.swift`: the global `dbQueue` `fatalError`s if the DB can't
      open — confirm crash-on-launch is acceptable vs. graceful degrade.
- [ ] `ExecutedOperation.swift`: `databaseTableName = "executed_operation"`
      matches the created table (the old `"excecuted_operation"` double-c typo is
      **FIXED** — do not re-flag). `set(...)` inserts a fresh row per call; `get`
      / `getAll(sessionId:)` / `getAll(name:)` / `delete` filter by session.
      Verify `createdAt.desc` ordering is what the RegisterMenu / analysis reads
      expect.
- [ ] `Session.swift`: `Session.update(at:newSessionName:)` now filters on
      `Columns.id` **and** calls `session.update(db)` after mutating (the old
      wrong-column + missing-persist bug is **FIXED** — do not re-flag; a test
      pins the rename). Note a **copy-paste log bug** remains: `getByName` logs
      `"getSessionById error"`.
- [ ] `Mark.swift`: `set(...)` first scans all marks for one with identical
      `isVisual` + CG points and, if found, **renames that unrelated mark to the
      new name** instead of inserting — confirm this dedup matches intended Vim
      semantics (it can silently rename mark `b` to `a`). Upsert otherwise relies
      on the `(sessionId, mark)` unique key. Copy-paste log strings say
      `"Mark - get"` inside `set`.
- [ ] **[SEC]** `Register.swift`: stores arbitrary `NSPasteboardItem` bytes
      (every type-rep, `NSKeyedArchiver` blob) in the (temp-dir, unencrypted)
      SQLite. Clipboard content frequently includes secrets (password-manager
      copies). There is **no filtering of concealed/transient types**
      (`org.nspasteboard.ConcealedType`, `…TransientType`, `…AutoGeneratedType`)
      — a privacy concern for a tool that auto-cycles the numbered ring on every
      pasteboard change (`cycleNumbered`) and seeds register "0" from the
      clipboard at launch. Decode uses a restricted class list (good).
      `extractOriginURL` also persists source URL + `sourceAppBundleId`.
- [ ] `Register.cycleNumbered`: the FIFO ring shift (delete "9", rename 8→1 in
      reverse, upsert "1" and "0") runs inside one `dbQueue.write` — verify
      atomicity and that the rename order can't violate the `(sessionId,
      register)` unique constraint mid-shift. **(A ring-shift test exists.)**
- [ ] `Jump.swift`: `set` derives the new id as `getAll().count + 1` — **not
      robust** after deletes (id reuse / PK collision). The happy-path append is
      tested, but the delete-then-add collision is not.
- [ ] `Macro.swift`: fully implemented model, but its table is never created
      (see the top bug) and the header says "TODO remove this as it can be put
      into register." Confirm macros are dead for now — no code path can persist
      one.
- [ ] `OperationName+Category.swift`: the `category` switch is deliberately
      **total** (no `default:`) so a new `OperationName` is a compile error until
      categorized. **(Categorization + Codable round-trip are unit-tested.)**
      Verify the bucketing is sensible (e.g. `goToMark`/`snapToGrid` → `.motion`
      so the movement after-hooks treat them like motions; issue #3 open question
      3 on whether `goToMark`/`jumpAdjacentScreen` should trigger
      `front_app_follows_mouse`).
- [ ] `OperationRecorder.swift`: `OperationRecorder` is an `actor` draining an
      `AsyncStream<RecordedOperation>` in FIFO submission order, writing each via
      `ExecutedOperation.set`. `enqueue` is `nonisolated` (MainActor caller pays
      only a buffer append). Verify: (a) `RecordedOperation` is a genuine
      `Sendable` scalar snapshot (it is — no `NSEvent`/`context` capture);
      (b) unbounded `AsyncStream` buffering under key-repeat can't grow without
      bound; (c) records land in a DB that survives (blocked by the temp-dir /
      always-reinit bugs above — telemetry is wiped every launch).
- [ ] **Error handling across the target**: every helper still wraps its GRDB
      call in `do/catch` and merely `debug(...)`s the error, returning
      `nil`/void. Silent failure is systemic — decide which ops must surface
      errors to the user (registers/marks especially).
- [ ] `dev/seed.swift`: gated by `NEOMOUSE_SEED=1`; confirm the seed path can
      never run in production and that its `Mark.set`/`Register.set` reentrancy
      into `dbQueue.write` can't deadlock GRDB.

---

## `neomouse` — executable: app shell, input pipeline, operations, UI

Responsibility: the `@main App`, the observable `NeoMouseState`, the global
event tap, the per-mode key dispatch + execution pipeline, the shared operation
implementations, and every overlay / menu / settings surface.

### App shell & lifecycle — `App/`

Files: `App/NeoMouseApp.swift`, `App/AppDelegate.swift`

Checklist:
- [ ] `App/NeoMouseApp.swift`: `@main struct NeoMouse: App` holds all
      process-global mutable statics (`keyEventTap`, `keyEventTapRunLoopSource`,
      `keyHandler`, `mouseMonitor`, `pasteboardWatcher`, `modeObserver`,
      `isVisualObserver`, `settingsWatcher`, `sharedState`, `swallowCurrentKeyEvent`).
      Verify no data races and that `AppDelegate` teardown nils them all.
- [ ] `NeoMouseApp.init()`: calls `initializeDB(forceReIntialize:)` (env
      `FORCE_REINTIALIZE`), optional `seedAll()`, loads `Session.getLast()`, and
      shows a fatal alert + quits if no session / no session id. Seeds register
      "0" from the clipboard at launch (**[SEC]** ties to the concealed-clipboard
      concern). Confirm `deployBundledDefaultsIfMissing()` never overwrites a
      user's `~/.config/neomouse/settings.toml`.
- [ ] `NeoMouseState` is `@unchecked Sendable` `ObservableObject` — the eight
      per-coord CG properties are now **computed shims** over two `VisualState`
      structs (`visual`/`previousVisual`), with `mergeX/mergeY` helpers. Verify
      the shims never produce a torn point and that `@unchecked` is justified
      (all mutation is main-actor). `resolvedGrid(usable:)` guards divide-by-zero
      — confirm.
- [ ] `App/AppDelegate.swift`: `applicationWillFinishLaunching` sets `.accessory`
      policy; `applicationWillTerminate` disables the tap, removes the run-loop
      source, cancels observers, invalidates the pasteboard watcher, posts
      `Mouse.up(.left/.right)` to release any synthesized drag, and exits visual
      state. Verify teardown is complete and idempotent (paths that
      `exit(0)`/`terminate` may bypass it — see CommandLine / MenuBar).

### Input pipeline — `Input/`

Files: `Input/KeyEventTap.swift`, `Input/KeyDispatch.swift`,
`Input/KeyEventContext.swift`, `Input/ExecutionPipeline.swift`,
`Input/Handlers/*`

Checklist:
- [ ] **[SEC] highest-priority review.** `KeyEventTap.installKeyEventTap`:
      `.cgSessionEventTap` `keyDown` tap. In `.defaultTap` (default,
      `isDisableKeyInput = true`) it **swallows most plain a-z0-9 keystrokes
      system-wide while any non-disabled mode is active** — a keylogger-capable
      surface. Audit the pass-through filter exhaustively: Cmd/Ctrl/Opt chords
      (Ctrl exempted in command/menu mode), Esc/Tab/Backspace/Return/arrows/
      F1–F20, `keyCode >= 128`, and Shift-not-a-modifier so capitals still handle.
- [ ] **[SEC]** `KeyEventTap`: the `eventSourceUserData ==
      System.synthesizedEventUserData` pass-through lets self-synthesized keys
      through — confirm another process can't post that sentinel to bypass the
      swallow filter. The `.listenOnly` branch (`isDisableKeyInput = false`)
      ignores its return value; confirm state updates still fire.
- [ ] `KeyEventTap`: re-enables the tap on `.tapDisabledByTimeout` /
      `.tapDisabledByUserInput` (both branches do). Confirm the callback stays
      under the per-event time budget (heavy `keyHandler` work risks OS-disable).
      Confirm Accessibility (`AXIsProcessTrustedWithOptions`), Input Monitoring
      (`IOHIDRequestAccess`), and Screen Recording (`Screenshot.requestAccess`)
      are all prompted up-front and a denial degrades to a logged no-op, not a
      crash.
- [ ] `Input/KeyDispatch.swift`: `makeKeyHandler` builds the per-keystroke
      derived values, resets `swallowCurrentKeyEvent`, handles the ⌘E
      activate/deactivate chord (the ONLY setter of `swallowCurrentKeyEvent`),
      builds a `KeyEventContext`, and switches on `appState.mode` into the
      `handle*Mode` statics. **[ROUGH]** After normal/find/specialFind dispatch
      it calls the *coarse* movement after-hooks directly —
      `autoSnapToCursorBandIfNeeded`, `syncVisualEndToCursor`,
      `CoreOperations.setFrontMostAppOnCursorAsActiveIfNeeded` — i.e.
      `front_app_follows_mouse` + auto-snap do **not** yet run through
      `ExecutionPipeline`'s hooks (see below). Verify no double-fire once they
      migrate.
- [ ] `Input/ExecutionPipeline.swift`: `Command` value + `ExecutionPipeline`
      (`preHooks` → `action` → `postHooks`). **[ROUGH] the pipeline is only
      partially wired:** `preHooks` is **empty**, `postHooks` is just
      `[recordOperation]`, and `execute(_:context:)` is only reached via
      `NeoMouse.executeMotion` — which is called from **exactly 4 cardinal-motion
      sites in `NormalModeHandler`**. So operation *recording currently covers
      only those motions*; register/visual/find/gesture/mark ops are **not
      recorded** yet, and the auto-snap / `front_app_follows_mouse` after-hooks
      still fire coarsely at dispatch rather than category-filtered here. Confirm
      the `keysUsed`/`OperationName`/`startPoint` values the 4 sites pass are
      accurate, and treat "record everything" as aspirational until every op
      routes through `execute()`.
- [ ] `Input/KeyEventContext.swift`: `@MainActor struct` bundling event +
      derived per-key values. Confirm it's rebuilt every keystroke and never
      cached across events.
- [ ] `Input/Handlers/NormalModeHandler.swift` (**~1217 lines** — the split of
      the old `KeyHandlers.swift` monolith per #4 lifted the case body out
      *verbatim*; internal nested switches preserved). `handleNormalMode`
      re-binds the ctx fields to locals then runs the original giant switch.
      Verify count parsing, `$`/`0`/`G`/`gg` motions (note the CLAUDE #5
      `$`-modifier-guard concern — confirm it's actually handled here),
      mark/register name validation, and that `registerAction` routes to the
      right `CoreOperations` call. The repeated `modifierFlags.rawValue == 256`
      magic-number checks want a named constant.
- [ ] `Input/Handlers/CommandModeHandler.swift`: appends chars, Tab/Shift-Tab
      cycle wildmenu `suggestionIndex`, Return fires
      `CommandLine.shared.executeSuggestionCommand(at:)` or `executeCommand(at:)`.
      Confirm only whitelisted `Config.Command`s run — no arbitrary-string
      execution path.
- [ ] `Input/Handlers/FindModeHandler.swift`: `executeFindModeOperation` owns
      grid-cell + inner-cell index → target-point math. Verify it matches the
      overlay exactly and handles out-of-range label indices without a
      force-unwrap.
- [ ] `Input/Handlers/{MenuModeHandler,SpecialFindModeHandler,DisabledModeHandler}
      .swift`: verify each exhaustively resets pending state and never leaves the
      app in an unreachable mode. `DisabledMode` should be an near no-op except
      the ⌘E re-enable path (handled upstream in KeyDispatch).
- [ ] **[TEST]** the live per-mode handlers remain **untested** — only the
      *spec* reducer in `motions.swift` (`PendingOpReducerTests`) has coverage.
      This is still the biggest behavioral test gap. `ExecutionPipeline` /
      `OperationRecorder` are likewise untested.

### Observers — `Observers/`

Files: `Observers/PasteboardObserver.swift`, `Observers/VisualMouseMonitor.swift`,
`Observers/SettingsWatcher.swift`

Checklist:
- [ ] `PasteboardObserver.swift`: `installPasteboardModeObserver` polls the
      clipboard only while `mode != .disabled`, and on change calls
      `Register.cycleNumbered` + `RegisterMenu.refresh()`. **[SEC]** confirm the
      numbered ring cycles only when intended (concealed-clipboard concern).
- [ ] `VisualMouseMonitor.swift`: the global `.mouseMoved`/`.leftMouseDragged`
      monitor is installed **only during visual mode** (documented reason: an
      always-on global monitor breaks `MenuBarExtra` clicks). `syncVisualEndToCursor`
      updates the selection end from the authoritative warped cursor after each
      motion. Verify install/remove is idempotent and the monitor is torn down on
      quit.
- [ ] `SettingsWatcher.swift`: `DispatchSource` file watcher, 250ms debounce,
      handles atomic-save (`.delete`/`.rename` → cancel + re-`open` after 75ms).
      Verify the re-watch can't leak file descriptors, a rapidly-rewritten file
      can't wedge it, and a decode failure keeps the previous config (surfaced
      via toast "Reload failed: …") rather than crashing. Only `theme`,
      `isAutoSnap`, `frontAppFollowsMouse` hot-reload via `NeoMouseState.reload`
      — confirm the "not reloadable" set (tap mode, mode_on_start, etc.) is
      genuinely restart-only.

### Shared operations — `Operations/`

File: `Operations/CoreOperations.swift` (`NeoMouse.CoreOperations` namespace)

Checklist:
- [ ] `normalYank`: guards `isVisual` + `currentVisualRect`, screenshots via
      `Screenshot.captureMultiDisplay(excluding: excludedWindowIDsForScreenshot)`
      in a `@MainActor Task`, writes an `NSImage` to `NSPasteboard.general`,
      plays the capture sound, resets mode. **[SEC]** confirm the excluded-window
      list (`compactMap` of six overlay `windowID`s) is complete so neomouse's
      own overlays never appear in the shot. Verify the TCC-denial path shows the
      toast + `Screenshot.openRecordingSettings()`.
- [ ] `registerYank` / `registerCurrentPasteboardItem` /
      `autoRegisterToNumeralsCurrentPasteboardItem` /
      `registerCurrentPasteboardItemToSystemRegister`: all capture `changeCount`
      **before** synthesizing `⌘C` / before the screenshot Task writes, then use
      `Pasteboard.waitForChange` — confirm the ordering avoids the race and a
      timeout can't write stale clipboard into a register. Each `guard let
      sessionId` early-returns with a log.
- [ ] `delete` synthesizes `⌘X`; `pasteFromRegister` clears + writes the register
      item then `⌘V` on the next runloop tick — confirm focus is on the target
      app (neomouse is non-activating) so the paste lands correctly.
- [ ] Visual-state helpers (`toggleVisualState`, `exitVisualState`,
      `goToPreviousVisualState`, `savePreviousAndClearVisual`) juggle
      `Mouse.down/up(.left)` — verify no path leaves a button stuck down
      (AppDelegate's terminate handler is the safety net; confirm the happy path
      releases too).
- [ ] `setFrontMostAppOnCursorAsActiveIfNeeded`: guarded by
      `appState.frontAppFollowsMouse`; calls `Mouse.setActiveApp`. This is the
      coarse hook that #3 intends to migrate into `ExecutionPipeline` as a
      `.motion`-category after-hook — see the **[ROUGH]** pipeline note.

### UI — `UI/`

Files:
- `UI/Menus/`: `MenuBar.swift`, `MarksMenu.swift`, `RegisterMenu.swift`
- `UI/Overlays/`: `GridOverlay.swift`, `NumbersOverlay.swift`,
  `CursorSurroundedGridOverlay.swift`, `VisualHighlightOverlay.swift`,
  `KeyCast.swift`, `ToastManager.swift`
- `UI/CommandLine/`: `CommandLine.swift`, `HelpDialog.swift`
- `UI/Settings/`: `SettingsView.swift`, `SettingsWindow.swift`
- `UI/Shared/`: `OverlayWindow.swift`, `Alert.swift`
- `UI/Theme/`: `Theme+SwiftUI.swift` (the SwiftUI bridge kept out of the
  SwiftUI-free `neomouseConfig`)

Checklist:
- [ ] Every overlay/menu is a `static let shared` singleton holding an
      `NSWindow`/`NSPanel`. Verify each exposes a valid `windowID` (used by the
      screenshot excluder) and that show/hide is race-free with mode changes.
- [ ] `UI/Menus/MenuBar.swift`: `MenuBarExtra` mode-colored icon + Restart/Quit.
      `restart()` → `System.restart()` then `exit(0)` — confirm the tap is torn
      down first (or a fresh process re-installing the tap doesn't collide).
      **[SEC]** confirm Diagnostics → Show Debug Log only opens the user's own log.
- [ ] **[SEC]** `UI/Settings/SettingsView.swift`: the `ThemeWriter` /
      `ConfigWriter` paths **write to the user's `settings.toml`** via
      `write(to:atomically:)`. Audit that `ThemeWriter` preserves every
      non-`[theme.*]` byte (re-read + splice), that `ConfigWriter`'s line-level
      rewrite can't corrupt/duplicate keys, and that a malformed existing file
      doesn't cause data loss. Confirm Save order (config knobs first, then theme
      re-reads the updated file).
- [ ] `UI/Settings/SettingsWindow.swift`: force-pauses neomouse (mode →
      `.disabled`) while open. Verify re-enable (⌘E) and that `is_auto_snap`
      takes effect on the next motion.
- [ ] `UI/CommandLine/CommandLine.swift`: `executeCommand(at:)` maps
      `Config.Command`s to actions incl. `.restart` (`System.restart()` +
      `exit(0)`) and `.quit` (`NSApp.terminate`). Confirm the two exit strategies
      are intentional and that `delmarks`/`registers`/`jumps` operate only on the
      current session. `executeCommand` guards invalid command strings.
- [ ] `UI/Overlays/NumbersOverlay.swift` + `UI/CommandLine/HelpDialog.swift` are
      the heaviest UI files — spot-check the ruler/gutter direction math and the
      keybind reference for staleness vs the real handlers.
- [ ] `UI/Menus/MarksMenu.swift` / `RegisterMenu.swift`: keyboard-navigable DB
      browsers. **[SEC]** `RegisterMenu` renders stored clipboard content + the
      resolved source-app icon/name — confirm no sensitive content is shown
      unintentionally and that `refresh()` reflects deletes.
- [ ] `UI/Theme/Theme+SwiftUI.swift`: the `ThemeColor/ThemeFont/ThemeMaterial/
      ThemeAnchor` → SwiftUI bridges. Verify hex-invalid colors fall back
      sensibly (tests show `.hex` falls back to black).

---

## Tests — `Tests/neomouseTests` (swift-testing)

Responsibility: unit coverage for the pure/testable helpers, DB models, config
decoding, and screenshot error classification.

Files:
- `Config/ConfigDecodingTests.swift` — happy-path decode + `Configuration`
  defaults, integer→Double coercion, theme override + sibling defaults, hex color
  decode, **strict unknown-key rejection**, **invalid-enum error**.
- `Config/ThemeColorTests.swift` — `#rrggbb`/`#rrggbbaa`/`#rgb`/`#rgba`, optional
  `#`, malformed→nil, `.hex` fallback-to-black.
- `DB/DBModelTests.swift` — `.serialized`, reinit-per-test; CRUD for `Session`
  (incl. the `update` rename regression), `Mark`, `Register` (incl. `cycleNumbered`
  ring shift + `delete`), `Jump` (append + `deleteAfter`), `ExecutedOperation`.
- `DB/OperationCategoryTests.swift` — `OperationName.category` mapping + Codable
  round-trip (incl. `exCommand` payload) + `CommandCategory` raw-value round-trip.
- `Utils/`: `HJKLTests`, `MotionTargetsTests`, `ScreenTests`
  (`adjacentDisplayRect` 5×5 grid), `PendingOpReducerTests` (the *spec* reducer),
  `KeyCodeMapTests` (`@MainActor`-pinned), `MouseTests`, `ScreenshotTests`
  (`isTCCError` / `-3801`).

Checklist:
- [ ] Coverage is now solid for pure helpers, **all DB models except `Macro`**
      (no table), config decode + strict validation, and `ThemeColor`. The DB
      suite reinitializes per test — confirm `.serialized` genuinely prevents the
      shared on-disk `dbQueue` from cross-contaminating.
- [ ] **[TEST] remaining gaps:** the live per-mode handlers (`NormalModeHandler`
      et al.), the `ExecutionPipeline` + `OperationRecorder` recording path, and
      `Macro` (blocked on its missing table). The tested reducer is the *spec*,
      not `handleNormalMode`.

---

## Cross-cutting & repo-level notes

- [ ] **[SEC] License mismatch — STILL OPEN.** `Info.plist`'s
      `NSHumanReadableCopyright` says *"Copyright © 2026 Samuel Wai Weng Yong.
      MIT licensed."* but the repo `LICENSE` and README declare **GPL-3.0**.
      Reconcile before release — a wrong license string in a shipped bundle is a
      real problem.
- [ ] **Doc drift — README.** README's project-layout section (~line 366+) still
      describes the **pre-reorg flat layout**: `Sources/neomouse/modes/visual.swift`
      (no `modes/` dir — visual-mode exit lives in `Operations/CoreOperations.swift`),
      flat `ui/*.swift` (now `UI/<category>/`), and `Sources/neomouse/old/` +
      `Sources/neomouseUtils/old/` (deleted in #4). Update the layout section to
      the current `App/ Input/ Input/Handlers/ Observers/ Operations/ State/
      UI/<category>/` tree.
- [ ] **Dead code — mostly cleared by #4.** The old `old/` dirs, `keymap.swift`,
      `validation.swift`, `stringToInt.swift`, and stray non-namespaced free-func
      files are gone from the tree. Remaining dead-ish surface: `Macro` (model
      with no table), the commented-out macro `db.create` block, and the
      commented-out numbered-register reset switch at the bottom of
      `KeyDispatch.makeKeyHandler`.
- [ ] **Force-unwraps / magic numbers.** Audit `CGEventType(rawValue: 29)!` in
      `Mouse/postGestureEvent.swift` + `Mouse/gestures.swift`, and the repeated
      `modifierFlags.rawValue == 256` literal across the handlers.
- [ ] **Concurrency.** Builds under `swiftLanguageModes: [.v6]` with
      `@unchecked Sendable` escape hatches (`NeoMouseState`, `KeyCodeMap`) and
      several `MainActor.assumeIsolated` hops in the tap/observer callbacks —
      confirm each is genuinely main-actor-confined. `OperationRecorder` is a
      real `actor` with a `nonisolated enqueue` — verify the `AsyncStream`
      continuation is the only shared mutable state.
- [ ] **Pinned deps** (`Package.swift`, all `exact:`): GRDB **7.11.1**,
      TOMLDecoder **0.4.5**, swift-testing **6.3.1**; tools 6.3, macOS 14+.
      Verify these are current/maintained and that TOMLDecoder 0.4.5 (a 0.x
      release, single-maintainer) is acceptable for a shipping tool.
