import { describe, expect, it } from "vitest"
import { FEATURES, INSTALL_METHODS, MODES, NAV_LINKS } from "@/data/site"

describe("site content", () => {
  it("has unique, non-empty mode ids", () => {
    const ids = MODES.map((m) => m.id)
    expect(ids.every((id) => id.length > 0)).toBe(true)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("every feature names a PascalCase icon", () => {
    for (const feature of FEATURES) {
      expect(feature.icon).toMatch(/^[A-Z][A-Za-z0-9]*$/)
    }
  })

  it("every install method carries a code snippet", () => {
    for (const method of INSTALL_METHODS) {
      expect(method.code.length).toBeGreaterThan(0)
    }
  })

  it("ships navigation links", () => {
    expect(NAV_LINKS.length).toBeGreaterThan(0)
  })
})
