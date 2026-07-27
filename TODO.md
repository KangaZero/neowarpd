> [!IMPORTANT]
> **Human review needed.** AI-generated; not yet confirmed by a human. See AI_POLICY.md.

# TODO

Working backlog for **neomouse** (the SwiftUI menu-bar app — not the old C
prototype). Items are grouped by theme; roughly ordered within each group.
The pre-Swift MVP list (hjkl in `main.h`, a `Makefile`, an install script, a
mode-activation key) is **done or obsolete** and has been removed — those
motions, modes, marks, jumps, visual mode, the command palette, and the
`just`/SwiftPM build all exist today.

Issues **#3** (command categorization + pre/after-hook pipeline), **#4**
(source-tree reorg), and **#5** (code-health audit) have **landed on `main`**,
so their work is gone from this list. What survives: the still-open slices of
the sessions & command-history feature, the code-health items #5 flagged that
are *not yet fixed* (re-verified against the current tree), and the platform /
distribution follow-ups from #1. See `CLAUDE.md` for architecture.

## What landed (context — not a checklist)

- **#4 reorg.** `KeyHandlers.swift` split into `Input/KeyDispatch.swift` +
  per-mode `Input/Handlers/*.swift`; `NeoMouseApp.swift` decomposed; flat `ui/`
  regrouped into `UI/<category>/`; `theme.swift` split into `Theme/`; tests
  regrouped per module; dead `old/` code deleted; stray free funcs made static.
- **#3 pipeline.** `CommandCategory` (in `neomouseTypes`) + `OperationName`
  categorization (`OperationName+Category.swift`) + the `ExecutionPipeline`
  pre/post-hook chokepoint + a serial `OperationRecorder` actor. **Recording is
  now wired**: the `recordOperation` post-hook enqueues a `RecordedOperation`
  that drains into `ExecutedOperation.set` in FIFO keystroke order.
- **#5 fixes.** `ExecutedOperation.databaseTableName` typo → `"executed_operation"`;
  `Session.update` now matches on `id` and actually calls `update(db)`; DB /
  Config / Screenshot unit suites added. `front_app_follows_mouse` is wired
  (`CoreOperations.setFrontMostAppOnCursorAsActiveIfNeeded` fires from the
  dispatch).

## Sessions & command history

Goal: record every executed operation, tie it to a session, and surface it in a
browsable **history panel** you can re-run from — reusing the existing
`neomouseDB` models (`ExecutedOperation`, `Session`, `Macro`) and the menu-mode
browser pattern (`MarksMenu`, `RegisterMenu`).

Recording itself is **done** (see above) — each op is persisted with its
`OperationName`, category, `keysUsed`, mode, start/end points, and `sessionId`.
The DB read helpers also already exist: `ExecutedOperation.getAll(sessionId:)`,
`get(id:sessionId:)`, `getAll(name:sessionId:)`, and `delete(id:sessionId:)`.
The remaining work is the UI, re-execution, session lifecycle, and retention:

- [ ] **History panel (new menu-mode browser).** Add a keyboard-navigable panel
      (sibling of `UI/Menus/MarksMenu.swift` / `UI/Menus/RegisterMenu.swift`,
      e.g. `UI/Menus/HistoryMenu.swift`) listing recent operations with mode, op
      name, `keysUsed`, and timestamp; scrollable, newest-first. Needs a new
      `MenuWindow.history` case in `neomouseTypes` (`modes.swift` currently has
      only `.marks` / `.register`) plus a `MenuModeHandler` branch. No panel
      exists yet.
- [ ] **Re-execute from history.** Select an entry and replay it by feeding it
      back through `ExecutionPipeline.execute`. The pipeline + `Command` value
      exist, but only `NeoMouse.executeMotion` builds one today; add a generic
      `execute(OperationName)` re-dispatch (map a stored op → a `Command` +
      `action`) so history entries — not just live keypresses — can drive it.
- [ ] **Session lifecycle / boundaries.** Row-level association is already done
      (`sessionId` threads through `KeyEventContext` → `Command` →
      `RecordedOperation`). Still open: decide + wire when a `Session` starts and
      closes (per launch? per active period? honor `new_session_on_open` /
      `max_session_count` from `[configuration]`) and bump `updatedAt` as ops
      accrue.
- [ ] **Search / filter** the history panel (by mode, category, op name, or
      fuzzy text — mirror the `:` command overlay's suggestion filtering).
      `getAll(name:sessionId:)` covers the exact-name case; fuzzy/category
      filtering is new.
- [ ] **Promote history → macro.** Select a contiguous range and save it as a
      `Macro` for one-key replay. **Blocked**: the `macro` table is still
      commented out in `initializeDB` — create it first (see code-health below).
- [ ] **Retention policy / cap** on stored operations (avoid unbounded DB
      growth); a `:clearhistory` command (add to `[commands]` + schema + the `:`
      handler) and a settings toggle to disable recording (a pre-hook guard on
      `recordOperation`). None of these exist yet.

## Known bugs / code-health (still open after #5)

Re-verified against the current tree — the typo, `Session.update`, and thin
tests from the old list are **fixed** and removed. These remain:

- [ ] **`initializeDB` still re-initializes every launch.** The tables-exist
      guard now exists, *but* it checks `db.tableExists("macro")` while the
      `macro` table's `create` block is commented out — so the guard is
      permanently false and every launch drops + recreates all tables, wiping
      persistent history/marks. Create the `macro` table (unblocks the
      history→macro promotion above) so the guard can pass.
- [ ] **DB lives in a temp dir** — `dbPath` is under
      `FileManager.default.temporaryDirectory` in `AppDatabase.swift`, so it
      doesn't survive reliably. Move to a stable Application Support path.
- [ ] **No DB migration path** — schema is built with `db.create(table:)` and a
      destructive drop-all re-init; there is no `DatabaseMigrator`. Add one
      before history data becomes worth keeping.
- [ ] **Clipboard/register storage is unencrypted** and does not filter
      concealed pasteboard types (passwords, `org.nspasteboard.ConcealedType`).
      `Register` archives the raw `NSPasteboardItem` blob with no redaction —
      filter/redact concealed + transient types before persisting.
- [ ] **`$` motion missing its modifier guard.** The `"$"` case in
      `NormalModeHandler.swift` fires with no `event.modifierFlags` check,
      unlike the guarded `m` / `r` / `R` cases beside it — so it triggers when
      it shouldn't (extra modifiers held).
- [ ] Audit **force-unwrap crash risks** and **silently-swallowed errors** — the
      DB layer still `debug(...)`-and-continues on every `catch` (`getAll`,
      `set`, `delete`, `update`), which hides real failures.
- [ ] **License mismatch**: `Info.plist` copyright string still says *"MIT
      licensed"*, but the project switched to GPL-3.0 (the `LICENSE` file and
      README are already GPL-3.0). Reconcile `Info.plist` to GPL-3.0.

## Command pipeline & config (remaining slices of #3)

The categorization layer and the recording post-hook are done. What's left:

- [ ] **Move `auto-snap` + `front_app_follows_mouse` into `ExecutionPipeline`
      after-hooks** (category-filtered to `.motion`). They currently fire
      coarsely at the dispatch site in `KeyDispatch.swift`; the post-hook array
      only holds `recordOperation`. Convert every relevant call site to
      `execute(_:context:)` first, then relocate them so the coarse calls can be
      removed without a double-fire window (see the note in
      `ExecutionPipeline.swift`).
- [ ] **Kill the repeated `appState.mode = .normal(...)` reset boilerplate** by
      folding the reset into the pipeline / dispatch, per motion's differing
      pending-state needs.
- [ ] Config-driven keybindings (remap motions/actions via `settings.toml`) —
      `neomouseConfig/keymap.swift` is still fully commented-out scaffolding.

## Ship v0.0.1 — run on a Mac (cannot be done on Linux/WSL)

Ordered. The repo-hardening work bumped deps + the flake to `0.0.1`, but the
release isn't cut yet, so `nix build` / `brew install` don't resolve.

- [ ] **Regenerate `Package.resolved`** for the dep bumps (GRDB 7.11.1,
      TOMLDecoder 0.4.5): `swift package update GRDB.swift TOMLDecoder`, then
      commit it. **`swift build` fails until this is done.**
- [ ] **Verify green**: `just all` (lint + test + universal release build);
      optionally `nix flake check`.
- [ ] Confirm the **`HOMEBREW_TAP_TOKEN`** repo secret exists (else `release.sh`
      skips the tap bump and you'd bump the tap by hand).
- [ ] **Apply the staged tap formula** to `KangaZero/homebrew-neomouse`
      (`Formula/neomouse.rb`) from `scripts/release-v0.0.1-prep/neomouse.rb`
      per that directory's README — it carries the universal `.app`-bundle
      install block and drops the old `depends_on arch: :arm64`.
- [ ] **Cut the release**: `git tag v0.0.1 && git push origin v0.0.1`.
      `release.yml` builds the universal binary, publishes the GitHub Release,
      and rewrites `flake.nix`'s `version` + `hash`. After this, `nix build`
      and `brew install neomouse` both resolve v0.0.1.
- [ ] **Verify the install paths**: `nix run github:KangaZero/neomouse`, and
      `brew untap/tap/install/test neomouse` (steps in
      `scripts/release-v0.0.1-prep/README.md`).

## Platform — longer horizon

- [ ] Track the `macos-13` Intel-runner deprecation and that nixpkgs 26.05 is
      the last `x86_64-darwin` channel.

---

## Reference — Vim jump-list semantics

Design reference (not a checklist) for the marks/jumps feature: which Vim
motions push onto the jump list. Kept because neomouse mirrors these semantics.

**Adds to jump list — large/line motions:** `gg`, `G`, `{n}G`, `{n}gg`, `H`,
`M`, `L`, `{`, `}`, `(`, `)`, `[[`, `]]`, `[]`, `][`.

**Adds to jump list — search:** `/pattern`, `?pattern`, `n`, `N`, `*`, `#`,
`g*`, `g#`.

**Adds to jump list — marks:** `` `a `` (exact), `'a` (line), `` `. `` / `'.`
(last change), `` `^ `` (last insert), `` `[ `` / `` `] `` (last yank/change
bounds), `` `< `` / `` `> `` (last visual bounds), `` `` `` / `''` (position
before last jump).

**Adds to jump list — bracket/tag/ex/window:** `%`, `[{`, `]}`, `[(`, `])`;
`Ctrl-]`, `Ctrl-T`, `:tag {name}`; `:{line}`, `:/{pattern}`, `:?{pattern}`;
`gf`, `gF`, `Ctrl-^`.

**Does NOT add to jump list:** `h`/`j`/`k`/`l` (too granular); `w`/`b`/`e`/`ge`
and `W`/`B`/`E` (word motions); `0`/`^`/`$` (line-internal); `f`/`F`/`t`/`T` and
`;`/`,` (in-line char search); `+`/`-`/`_` (line motions, not jumps); `zz`/`zt`/
`zb` (scroll, no line change); `Ctrl-D`/`Ctrl-U`/`Ctrl-F`/`Ctrl-B` (scroll);
insert/edit commands (`i`/`a`/`o`, `x`/`d`/`c`, …).

**List navigation itself:** `Ctrl-O` (older), `Ctrl-I`/`Tab` (newer) — move the
pointer without adding entries.

**List semantics:** truncation (a new jump while not at the newest entry
discards everything forward); dedup of consecutive same-location entries;
per-window lists; capped at 100 entries (oldest fall off); `:clearjumps` wipes
it.
