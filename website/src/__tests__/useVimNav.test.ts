import { beforeEach, describe, expect, it, vi } from "vitest"
import { effectScope } from "vue"
import { useVimNav } from "@/composables/useVimNav"
import { ui } from "@/store"

function press(key: string) {
  window.dispatchEvent(new KeyboardEvent("keydown", { key }))
}

/** Run the composable in a disposable scope so its listener is cleaned up. */
function withNav(fn: () => void) {
  const scope = effectScope()
  scope.run(() => useVimNav())
  try {
    fn()
  } finally {
    scope.stop()
  }
}

describe("useVimNav", () => {
  beforeEach(() => {
    ui.helpOpen = false
    ui.pendingCount = ""
    window.scrollBy = vi.fn()
    window.scrollTo = vi.fn()
  })

  it("accumulates a numeric count prefix", () => {
    withNav(() => {
      press("1")
      press("0")
      expect(ui.pendingCount).toBe("10")
    })
  })

  it("treats a leading 0 as a motion, not a count", () => {
    withNav(() => {
      press("0")
      expect(ui.pendingCount).toBe("")
    })
  })

  it("pages down by the pending count on 'j', then resets it", () => {
    withNav(() => {
      press("3")
      press("j")
      expect(window.scrollBy).toHaveBeenCalledWith({
        behavior: "smooth",
        top: 3 * (window.innerHeight - 60),
      })
      expect(ui.pendingCount).toBe("")
    })
  })

  it("jumps to the top on the two-key 'gg' motion", () => {
    withNav(() => {
      press("g")
      press("g")
      expect(window.scrollTo).toHaveBeenCalledWith({
        behavior: "smooth",
        top: 0,
      })
    })
  })

  it("pages up by the pending count on 'k'", () => {
    withNav(() => {
      press("2")
      press("k")
      expect(window.scrollBy).toHaveBeenCalledWith({
        behavior: "smooth",
        top: -2 * (window.innerHeight - 60),
      })
    })
  })

  it("toggles the help overlay on '?'", () => {
    withNav(() => {
      press("?")
      expect(ui.helpOpen).toBe(true)
      press("?")
      expect(ui.helpOpen).toBe(false)
    })
  })

  it("focuses the search box on '/'", () => {
    withNav(() => {
      const search = document.createElement("input")
      search.setAttribute("data-vim-search", "")
      document.body.appendChild(search)
      press("/")
      expect(document.activeElement).toBe(search)
      search.remove()
    })
  })

  it("closes the help overlay on Escape", () => {
    withNav(() => {
      ui.helpOpen = true
      press("Escape")
      expect(ui.helpOpen).toBe(false)
    })
  })

  it("ignores keystrokes while typing in an input", () => {
    withNav(() => {
      const input = document.createElement("input")
      document.body.appendChild(input)
      input.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, key: "j" })
      )
      expect(window.scrollBy).not.toHaveBeenCalled()
      input.remove()
    })
  })
})
