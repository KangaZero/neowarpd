import type { RouteLocationRaw } from "vue-router"

/**
 * Single source of truth for ALL site content. Every component reads from here
 * — nothing hard-codes copy, links, or data inline. Typed end-to-end so a typo
 * in a route or a missing field is a compile error, not a runtime surprise.
 *
 * (Docs prose lives in src/docs/*.md — that's the docs' own single source,
 * also consumed by `just gen-man`.)
 */

/** A non-empty readonly array: guarantees `[0]` exists at the type level. */
type NonEmpty<T> = readonly [T, ...T[]]

// --- meta -------------------------------------------------------------------

export const SITE = {
  description:
    "A Vim-motion, keyboard-driven mouse-control daemon for macOS. Drive the cursor, clicks, scrolls, and gestures without leaving the home row.",
  license: "GPL-3.0-only",
  name: "neomouse",
  releasesUrl: "https://github.com/KangaZero/neomouse/releases",
  repoUrl: "https://github.com/KangaZero/neomouse",
  tagline: "Vim motions for your mouse.",
} as const

// --- navigation -------------------------------------------------------------

export interface NavLink {
  readonly label: string
  readonly to: RouteLocationRaw
}

export const NAV_LINKS: NonEmpty<NavLink> = [
  { label: "Features", to: { hash: "#features", path: "/" } },
  { label: "Install", to: { hash: "#install", path: "/" } },
  { label: "Modes", to: { hash: "#modes", path: "/" } },
  { label: "Docs", to: { path: "/docs" } },
]

// --- hero -------------------------------------------------------------------

export const HERO = {
  badge: "macOS 14+ · Swift 6 · menu-bar daemon",
  subtitle:
    "Drive the cursor, clicks, scrolls, and gestures straight from the home row. A keyboard-driven mouse-control daemon that never asks you to reach for the trackpad.",
  titleAccent: "mouse.",
  titleLead: "Vim motions for your",
} as const

// --- modes ------------------------------------------------------------------

export interface Keybind {
  readonly keys: string
  readonly action: string
}

export interface Mode {
  readonly id: string
  readonly name: string
  /** Menu-bar status color, mirrored from the app's mode palette. */
  readonly accent: "green" | "amber" | "blue"
  readonly summary: string
  readonly binds: readonly Keybind[]
}

export const MODES: NonEmpty<Mode> = [
  {
    accent: "green",
    binds: [
      { action: "move the cursor", keys: "h j k l" },
      { action: "move with a numeric count", keys: "5j" },
      { action: "jump to top / bottom", keys: "gg / G" },
      { action: "jump to screen edge", keys: "0 / $" },
      { action: "snap to the nearest ruler cell", keys: "s" },
      { action: "scroll the view", keys: "H J K L" },
      { action: "jump between displays", keys: "Ctrl-w hjkl" },
      { action: "set a mark", keys: "m{a-z}" },
      { action: "jump back to a mark", keys: "'{a-z} / `{a-z}" },
      { action: "select a register", keys: '"{reg}' },
      { action: "open the help dialog", keys: "?" },
    ],
    id: "normal",
    name: "normal",
    summary:
      "hjkl moves the cursor. Counts (5j) and motions (gg, G, 0, $) work just like Vim.",
  },
  {
    accent: "blue",
    binds: [
      { action: "open the find grid", keys: "f" },
      { action: "warp to the labelled cell", keys: "{label}" },
    ],
    id: "find",
    name: "find",
    summary:
      "A labelled grid overlays the screen. One or two keypresses warp the cursor to any cell.",
  },
  {
    accent: "blue",
    binds: [
      { action: "land on a nearby cell", keys: "{label}" },
      { action: "nudge the cursor ±10 pts", keys: "q w e r" },
    ],
    id: "specialFind",
    name: "specialFind",
    summary:
      "A small grid appears around the cursor; a single keypress lands on the picked cell.",
  },
  {
    accent: "amber",
    binds: [
      { action: "enter visual mode", keys: "v" },
      { action: "yank (screenshot via ScreenCaptureKit)", keys: "y" },
      { action: "yank / paste through a register", keys: '"ay / "ap' },
    ],
    id: "visual",
    name: "visual",
    summary:
      "Entered with v. Movement extends a highlighted selection rectangle you can yank.",
  },
  {
    accent: "amber",
    binds: [
      { action: "open the command line", keys: ":" },
      { action: "cycle suggestions", keys: "Tab / Shift-Tab" },
      { action: "cycle suggestions", keys: "Ctrl-n / Ctrl-p" },
    ],
    id: "command",
    name: "command",
    summary:
      "':' opens a command line with fuzzy-filtered suggestions like numbers, delmarks, restart.",
  },
  {
    accent: "blue",
    binds: [
      { action: "move the selection", keys: "j / k" },
      { action: "activate the entry", keys: "Enter" },
    ],
    id: "menu",
    name: "menu",
    summary:
      "A keyboard-navigable marks browser and a Pasty-style register browser.",
  },
  {
    accent: "amber",
    binds: [],
    id: "disabled",
    name: "disabled",
    summary:
      "The event tap is listen-only. Every keypress passes straight to the focused app.",
  },
]

// --- features ---------------------------------------------------------------

export interface Feature {
  readonly icon: string
  readonly title: string
  readonly body: string
}

export const FEATURES: NonEmpty<Feature> = [
  {
    body: "hjkl, counts, marks, registers, and visual selections — the muscle memory you already have, pointed at the mouse.",
    icon: "Keyboard",
    title: "Vim motions, for the cursor",
  },
  {
    body: "Synthesized through the session event tap and CGWarpMouseCursorPosition, so it keeps working under Accessibility Zoom.",
    icon: "MousePointer2",
    title: "Clicks, scrolls & gestures",
  },
  {
    body: "A labelled overlay drops the cursor anywhere on screen in one or two keypresses. No hunting, no drift.",
    icon: "Grid3x3",
    title: "Grid-warp targeting",
  },
  {
    body: "Select a region and yank a real screenshot via ScreenCaptureKit, round-tripped through NSPasteboard registers.",
    icon: "Camera",
    title: "Visual yank",
  },
  {
    body: "Tune everything in settings.toml — validated against a JSON schema and hot-reloaded on save, no restart.",
    icon: "SlidersHorizontal",
    title: "Live-reloading config",
  },
  {
    body: "Ctrl-w hjkl jumps the cursor across displays. Tested on macOS 14+ with up to three screens.",
    icon: "Monitor",
    title: "Multi-display aware",
  },
]

// --- install ----------------------------------------------------------------

export interface InstallMethod {
  readonly id: string
  readonly label: string
  readonly blurb: string
  /** Shell (or nix) snippet shown in the code block. */
  readonly code: string
}

export const INSTALL_METHODS: NonEmpty<InstallMethod> = [
  {
    blurb:
      "The no-fuss path — brew handles the ad-hoc signature and your PATH.",
    code: [
      "brew tap KangaZero/neomouse",
      "brew install neomouse",
      "",
      "neomouse",
    ].join("\n"),
    id: "homebrew",
    label: "Homebrew",
  },
  {
    blurb:
      "Apple Silicon and Intel. Try it once, or add it to your system flake.",
    code: [
      "# run once, no install",
      "nix run github:KangaZero/neomouse",
      "",
      "# or install into your profile",
      "nix profile add github:KangaZero/neomouse",
    ].join("\n"),
    id: "nix",
    label: "Nix",
  },
  {
    blurb:
      "Grab the universal tarball from Releases, then clear the Gatekeeper quarantine.",
    code: [
      "# after downloading & unpacking the .app",
      "xattr -dr com.apple.quarantine neomouse.app",
      "open neomouse.app",
    ].join("\n"),
    id: "manual",
    label: "Manual",
  },
]
