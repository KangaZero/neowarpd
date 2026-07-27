---
title: Keybindings
slug: keybindings
order: 2
---

# Keybindings

Every mode has its own keymap. The daemon starts in `normal`.

## normal

`hjkl` moves the cursor. Numeric counts (e.g. `5j`) and motions (`gg`, `G`,
`0`, `$`) are supported.

| Keys | Action |
|---|---|
| `h` `j` `k` `l` | move the cursor |
| `5j` | move with a numeric count |
| `gg` / `G` | jump to top / bottom |
| `0` / `$` | jump to the screen edge |
| `s` | snap to the nearest ruler cell |
| `H` `J` `K` `L` | scroll the view |
| `Ctrl-w` then `hjkl` | jump between displays |
| `m{a-z}` | set a mark |
| `'{a-z}` / `` `{a-z} `` | jump back to a mark |
| `"{reg}` | select a register |
| `?` | open the help dialog |

## find

A labelled grid overlay covers the screen. One or two keypresses warp the
cursor to the chosen cell.

## specialFind

A small grid appears around the current cursor position. A single keypress
lands on the picked cell. `q` `w` `e` `r` nudge the cursor ±10 pts.

## visual

Entered with `v`. Movement extends a highlighted selection rectangle. `y` yanks
(a screenshot via `ScreenCaptureKit`). Register round-trips (`"ay`, `"ap`, …)
work with real `NSPasteboardItem` values.

## command

`:` opens a command-line overlay with fuzzy-filtered suggestions (`numbers`,
`relativenumbers`, `delmarks`, `restart`, …). `Tab` / `Shift-Tab` and
`Ctrl-n` / `Ctrl-p` cycle through matches.

## menu

A keyboard-navigable marks browser and a Pasty-style register browser.

## disabled

The event tap is in listen-only mode. Every keypress passes straight through to
the focused application.
