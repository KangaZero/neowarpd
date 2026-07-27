import { ref, shallowRef } from "vue"

/**
 * Vimium-style "f" hint mode: label every clickable element on screen, then let
 * the user type a label to activate it. Self-contained feature module — the
 * reactive state is module-level (one shared instance), the global keymap
 * (useVimNav) drives it, and HintOverlay.vue renders it.
 */

export interface Hint {
  readonly label: string
  /** Viewport coordinates (the overlay is position:fixed). */
  readonly x: number
  readonly y: number
  readonly el: HTMLElement
}

// Elements worth targeting. Mirrors Vimium's set, trimmed to what this site uses.
const CLICKABLE = [
  "a[href]",
  "button:not([disabled])",
  '[role="button"]',
  '[role="link"]',
  'input:not([type="hidden"]):not([disabled])',
  "select:not([disabled])",
  "textarea:not([disabled])",
  "summary",
  "label[for]",
  '[tabindex]:not([tabindex="-1"])',
].join(", ")

const ALPHABET = "abcdefghijklmnopqrstuvwxyz"

// shallowRef so DOM nodes inside the array aren't wrapped in reactive proxies.
const hints = shallowRef<Hint[]>([])
const typed = ref("")
const active = ref(false)

/**
 * Minimal-length, prefix-free labels (Vimium's algorithm): breadth-first build
 * strings by appending alphabet chars, then keep only the leaves (indices at or
 * past `offset`) so no returned label is a prefix of another.
 */
export function hintLabels(count: number): string[] {
  const strings = [""]
  let offset = 0
  while (strings.length - offset < count || strings.length === 1) {
    const prefix = strings[offset] ?? ""
    offset += 1
    for (const ch of ALPHABET) strings.push(prefix + ch)
  }
  return strings.slice(offset, offset + count)
}

function isVisible(el: HTMLElement): boolean {
  const r = el.getBoundingClientRect()
  if (r.width <= 0 || r.height <= 0) return false
  // Must intersect the viewport.
  if (
    r.bottom < 0 ||
    r.right < 0 ||
    r.top > window.innerHeight ||
    r.left > window.innerWidth
  ) {
    return false
  }
  const style = getComputedStyle(el)
  return (
    style.visibility !== "hidden" &&
    style.display !== "none" &&
    style.opacity !== "0"
  )
}

function activate(el: HTMLElement): void {
  const tag = el.tagName
  // Form fields want focus; everything else gets a real click (which also
  // triggers vue-router <a> handlers).
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") el.focus()
  else el.click()
}

export function enterHints(): void {
  const els = Array.from(
    document.querySelectorAll<HTMLElement>(CLICKABLE)
  ).filter(isVisible)

  // Top-to-bottom, left-to-right so labels read in a natural order.
  els.sort((a, b) => {
    const ra = a.getBoundingClientRect()
    const rb = b.getBoundingClientRect()
    return ra.top - rb.top || ra.left - rb.left
  })

  const labels = hintLabels(els.length)
  hints.value = els.map((el, i) => {
    const r = el.getBoundingClientRect()
    return { el, label: labels[i] ?? "", x: r.left, y: r.top }
  })
  typed.value = ""
  active.value = true
}

export function exitHints(): void {
  active.value = false
  hints.value = []
  typed.value = ""
}

export function hintBackspace(): void {
  typed.value = typed.value.slice(0, -1)
}

/**
 * Feed one typed character. Ignores chars that match no hint; activates as soon
 * as the typed string uniquely identifies a label.
 */
export function typeHintChar(ch: string): void {
  const candidate = typed.value + ch
  const matches = hints.value.filter((h) => h.label.startsWith(candidate))
  if (matches.length === 0) return // dead-end keystroke — ignore it

  typed.value = candidate
  const exact = matches.find((h) => h.label === candidate)
  if (exact) {
    const { el } = exact
    exitHints()
    activate(el)
  }
}

/** Reactive state for the overlay component. */
export function useHints() {
  return { active, hints, typed }
}

/** Read-only flag for the global keymap. */
export function isHintMode(): boolean {
  return active.value
}
