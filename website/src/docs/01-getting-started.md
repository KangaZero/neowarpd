---
title: Getting started
slug: getting-started
order: 1
---

# Getting started

`neomouse` is a macOS menu-bar daemon that intercepts keyboard events via a
global `CGEventTap` and translates Vim motions into mouse movements, clicks,
scrolls, and gestures. It runs in the background with no Dock icon — a
mode-colored status icon appears in the menu bar.

## Install

Pick one; all install the same universal (Apple Silicon + Intel) binary.

```sh
# Homebrew
brew tap KangaZero/neomouse
brew install neomouse

# Nix (run once, no install)
nix run github:KangaZero/neomouse
```

Then launch it:

```sh
neomouse
```

## Permissions

`neomouse` needs two macOS privacy permissions, both granted under
**System Settings → Privacy & Security**:

- **Accessibility** — required for the global `CGEventTap` to intercept and
  synthesize keyboard and mouse events.
- **Input Monitoring** — required to read raw key events from physical input
  devices while other applications are focused.

macOS prompts on first launch. Click *Allow* and relaunch. Until both
permissions are granted the event tap cannot install and `neomouse` will not
intercept keyboard input.

## The mode model

The interaction model is mode-based, mirroring Vim. On launch the daemon enters
the mode set by `mode_on_start` in `settings.toml` (default: `normal`). The
menu-bar status icon changes color with the active mode. See
[keybindings](#/docs?doc=keybindings) for what each mode does.
