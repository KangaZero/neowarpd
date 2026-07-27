---
title: Configuration
slug: configuration
order: 3
---

# Configuration

Runtime tuning lives in `settings.toml`, a TOML file validated against
`schema/settings.schema.json` at load time. The schema enforces strict key
validation: unknown keys and unknown enum values are rejected at decode time
and surfaced as a toast notification.

## Resolution order

Configuration is resolved once at startup. The first path that exists wins:

1. `$NEOMOUSE_CONFIG` — full path to an alternate `settings.toml` (overrides
   everything when set).
2. `~/.config/neomouse/settings.toml` — the standard per-user location.
   Auto-populated from the bundled defaults on first launch.
3. `~/Library/Application Support/neomouse/settings.toml` — macOS-native
   fallback.

If no settings file resolves, `NeoMouseState` falls back to compiled-in
defaults.

## Notable sections

- `[grid]` — find-mode overlay divisions, label alphabets, inner-character
  display.
- `[motion]` — `rows_on_screen` / `columns_on_screen` (integer or
  `"automatic"`) and cursor-clamping behaviour.
- `[visual]` — `minimum_highlight_width` for the selection rectangle.
- `[gesture]` — pinch/zoom step, scroll increments, rotation degrees.
- `[commands]` — whitelist of commands available in the command-mode overlay.
- `[configuration]` — `mode_on_start`, `is_disable_key_input`,
  `is_show_key_cast`, `is_auto_snap`, `max_session_count`, and related knobs.
- `[theme.*]` — per-element visual overrides for every overlay (nine
  sub-sections). Colors are hex strings (`#rrggbb` or `#rrggbbaa`); fonts are
  inline tables with `family`, `size`, `weight`, and `design`.

## Live reload

Theme and behaviour changes apply without restarting. `neomouse` watches the
resolved `settings.toml` for writes (debounced 250 ms, atomic-save aware) and
reloads automatically. The **Settings…** menu-bar item (or `⌘,` when focused)
opens a native preferences window where controls apply live; `⌘S` persists
changes to disk.

## Files

- `~/Library/Logs/neomouse/neomouse.log` — runtime log, written when running
  from a bundled `.app`. Reachable via **Diagnostics → Show Debug Log**.
