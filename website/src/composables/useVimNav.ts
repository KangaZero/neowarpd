import { useEventListener } from "@vueuse/core"
import { ui } from "@/store"

/**
 * Global Vim-style keyboard navigation for the whole page — the browser
 * equivalent of the daemon's own CGEventTap.
 *
 * All navigation *state* lives in the shared `ui` store (helpOpen, pendingCount);
 * this composable owns the *behaviour*:
 *  - a keydown listener (installed for the caller's lifetime),
 *  - guards so keystrokes in inputs / with modifiers pass through untouched,
 *  - a Vim-style numeric count accumulator (type `10` then `j` -> 10 * step),
 *  - `lastKey` tracking so two-key motions like `gg` can be detected,
 *  - the action helpers themselves (scroll, jump, search, help).
 *
 * The one thing left to wire is the *keymap* — which key runs which action.
 * That mapping is the interesting design decision, so it's a TODO(human) below.
 */
export function useVimNav(): void {
  // The previous non-digit key, for two-key motions (gg).
  let lastKey = ""

  // How much of the previous screen stays visible after a page jump — mirrors
  // the small overlap the native PageDown/PageUp keys keep so you don't lose
  // your place. One "page" = viewport height minus this.
  const PAGE_OVERLAP = 60
  const pageSize = () => window.innerHeight - PAGE_OVERLAP

  // --- action helpers -------------------------------------------------------
  // The keymap you write below calls into these. `n` is the resolved count
  // (defaults to 1 when no prefix was typed).
  const actions = {
    focusSearch() {
      document.querySelector<HTMLInputElement>("[data-vim-search]")?.focus()
    },
    halfPageDown() {
      window.scrollBy({ behavior: "smooth", top: window.innerHeight / 2 })
    },
    halfPageUp() {
      window.scrollBy({ behavior: "smooth", top: -window.innerHeight / 2 })
    },
    /** Page down `n` screens, like pressing PageDown n times. */
    pageDown(n: number) {
      window.scrollBy({ behavior: "smooth", top: n * pageSize() })
    },
    /** Page up `n` screens, like pressing PageUp n times. */
    pageUp(n: number) {
      window.scrollBy({ behavior: "smooth", top: -n * pageSize() })
    },
    toBottom() {
      window.scrollTo({ behavior: "smooth", top: document.body.scrollHeight })
    },
    toggleHelp() {
      ui.helpOpen = !ui.helpOpen
    },
    toTop() {
      window.scrollTo({ behavior: "smooth", top: 0 })
    },
  }

  function isTyping(target: EventTarget | null): boolean {
    const el = target as HTMLElement | null
    return (
      !!el &&
      (el.tagName === "INPUT" ||
        el.tagName === "TEXTAREA" ||
        el.isContentEditable)
    )
  }

  function onKey(event: KeyboardEvent) {
    // Never hijack typing or OS/browser shortcuts.
    if (isTyping(event.target)) return
    if (event.metaKey || event.ctrlKey || event.altKey) return

    const key = event.key

    // Escape always clears overlays + pending count.
    if (key === "Escape") {
      ui.helpOpen = false
      ui.pendingCount = ""
      lastKey = ""
      return
    }

    // Accumulate a numeric count (a leading "0" is the motion, not a count).
    if (/^[0-9]$/.test(key) && !(key === "0" && ui.pendingCount === "")) {
      ui.pendingCount += key
      return
    }

    const n = ui.pendingCount ? Number.parseInt(ui.pendingCount, 10) : 1

    // "j" pages down by the count (PageDown behaviour).
    if (key === "j") {
      actions.pageDown(n)
      event.preventDefault()
    }

    // Worked example 2 — two-key motion. "gg" jumps to the top (checks the
    // previous key via `lastKey`).
    if (key === "g" && lastKey === "g") {
      actions.toTop()
      event.preventDefault()
    }

    // Remaining motions. Page jumps respect the count `n`; half-page jumps are
    // fixed-size (Vim's Ctrl-d/Ctrl-u ignore the count too).
    if (key === "k") {
      actions.pageUp(n)
      event.preventDefault()
    } else if (key === "d") {
      actions.halfPageDown()
      event.preventDefault()
    } else if (key === "u") {
      actions.halfPageUp()
      event.preventDefault()
    } else if (key === "G") {
      actions.toBottom()
      event.preventDefault()
    } else if (key === "/") {
      // preventDefault stops the browser's own quick-find from opening.
      actions.focusSearch()
      event.preventDefault()
    } else if (key === "?") {
      actions.toggleHelp()
      event.preventDefault()
    }

    // Reset per-keystroke state. (A digit press returned early above, so by
    // here the count has been consumed by whatever motion just ran.)
    ui.pendingCount = ""
    lastKey = key
  }

  useEventListener(window, "keydown", onKey)
}
