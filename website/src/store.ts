import { useColorMode } from "@vueuse/core"
import { nextTick, reactive } from "vue"

/**
 * Single source of truth for global app state. Import `ui` / `theme` anywhere —
 * they are module-level singletons, so every component shares one instance (no
 * prop-drilling, no provide/inject). Keep this file the ONLY place global
 * reactive state is declared.
 */

export const ui = reactive({
  /** Whether the `?` keyboard-help overlay is open. */
  helpOpen: false,
  /** Pending Vim numeric count (e.g. "10" before "10j"); "" when none. */
  pendingCount: "",
})

/**
 * Light/dark mode. `useColorMode` persists to localStorage and toggles the
 * `.dark` class on <html> that the CSS keys off. Defaults to dark — the
 * terminal aesthetic is the designed-for state.
 */
export const theme = useColorMode({
  initialValue: "dark",
  // Two designed themes only; no "auto".
  modes: {},
  storageKey: "neomouse-theme",
})

/**
 * Toggle light/dark. When called from a pointer event on a browser that
 * supports the View Transitions API, the new theme "inks" across the page as an
 * expanding circle anchored at the click point. Falls back to an instant swap
 * when the API is missing, motion is reduced, or there's no event (keyboard).
 */
export function toggleTheme(event?: MouseEvent): void {
  const next = theme.value === "dark" ? "light" : "dark"
  // Bind so the runtime feature-check doubles as the guard (lib.dom types it as
  // always-present, but it's absent on older browsers).
  const startViewTransition = document.startViewTransition?.bind(document)
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

  if (!startViewTransition || reduced || !event) {
    theme.value = next
    return
  }

  const { clientX: x, clientY: y } = event
  // Radius reaching the farthest screen corner, so the circle covers everything.
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  )

  // The callback must mutate + flush the DOM before the API snapshots it, so we
  // await nextTick() (useColorMode toggles the .dark class in an async watcher).
  const transition = startViewTransition(async () => {
    theme.value = next
    await nextTick()
  })

  transition.ready
    .then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 450,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
        }
      )
    })
    .catch(() => {
      // A superseded transition rejects `ready`; nothing to clean up.
    })
}
