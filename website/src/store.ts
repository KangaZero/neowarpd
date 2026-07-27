import { useColorMode } from "@vueuse/core"
import { reactive } from "vue"

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

export function toggleTheme(): void {
  theme.value = theme.value === "dark" ? "light" : "dark"
}
