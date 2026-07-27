import { afterEach, describe, expect, it, vi } from "vitest"
import {
  enterHints,
  exitHints,
  hintLabels,
  typeHintChar,
  useHints,
} from "@/composables/useHints"

const { active, hints } = useHints()

function fakeButton(top: number): HTMLButtonElement {
  const btn = document.createElement("button")
  btn.getBoundingClientRect = () =>
    ({
      bottom: top + 20,
      height: 20,
      left: 10,
      right: 60,
      toJSON: () => ({}),
      top,
      width: 50,
      x: 10,
      y: top,
    }) as DOMRect
  document.body.appendChild(btn)
  return btn
}

afterEach(() => {
  exitHints()
  document.body.innerHTML = ""
})

describe("hintLabels", () => {
  it("returns exactly `count` labels", () => {
    expect(hintLabels(3)).toHaveLength(3)
    expect(hintLabels(40)).toHaveLength(40)
  })

  it("uses single letters when they fit", () => {
    expect(hintLabels(3)).toEqual(["a", "b", "c"])
  })

  it("is prefix-free (no label is a prefix of another)", () => {
    const labels = hintLabels(60)
    for (const a of labels) {
      for (const b of labels) {
        if (a !== b) expect(b.startsWith(a)).toBe(false)
      }
    }
  })
})

describe("hint mode", () => {
  it("labels visible clickable elements top-to-bottom", () => {
    fakeButton(30)
    fakeButton(10)
    fakeButton(20)
    enterHints()
    expect(active.value).toBe(true)
    expect(hints.value.map((h) => h.label)).toEqual(["a", "b", "c"])
    // Sorted by vertical position, so 'a' is the topmost (top: 10) button.
    expect(hints.value[0]?.y).toBe(10)
  })

  it("activates the matching element and exits", () => {
    const first = fakeButton(10)
    const second = fakeButton(20)
    const firstClick = vi.spyOn(first, "click")
    const secondClick = vi.spyOn(second, "click")

    enterHints()
    typeHintChar("b") // second button

    expect(secondClick).toHaveBeenCalledOnce()
    expect(firstClick).not.toHaveBeenCalled()
    expect(active.value).toBe(false)
  })

  it("ignores a keystroke that matches no hint", () => {
    fakeButton(10)
    enterHints()
    typeHintChar("z")
    expect(active.value).toBe(true) // still open, nothing activated
  })
})
