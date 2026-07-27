#!/usr/bin/env tsx
/**
 * Regenerate the neomouse man page from the docs Markdown (the single source of
 * truth). Concatenates src/docs/*.md in `order`, strips YAML frontmatter, and
 * pipes the result through pandoc (markdown -> roff man).
 *
 * Output goes to ../man/neomouse.1.generated so the hand-written page is never
 * clobbered silently — diff it, then promote when you're happy:
 *
 *   just gen-man
 *   diff ../man/neomouse.1 ../man/neomouse.1.generated
 *   mv ../man/neomouse.1.generated ../man/neomouse.1
 */
import { execFileSync } from "node:child_process"
import { readdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const docsDir = join(here, "..", "src", "docs")
const outFile = join(here, "..", "..", "man", "neomouse.1.generated")

interface Frontmatter {
  order: number
}

function parseFrontmatter(raw: string): {
  order: Frontmatter["order"]
  body: string
} {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/)
  if (!match) return { body: raw, order: 999 }
  const frontmatter = match[1] ?? ""
  const orderLine = frontmatter.split("\n").find((l) => l.startsWith("order:"))
  const order = orderLine ? Number(orderLine.split(":")[1]?.trim()) : 999
  return { body: raw.slice(match[0].length), order }
}

const files = readdirSync(docsDir).filter((f) => f.endsWith(".md"))
const sections = files
  .map((f) => parseFrontmatter(readFileSync(join(docsDir, f), "utf8")))
  .sort((a, b) => a.order - b.order)

// Pandoc man output takes its title from a `% TITLE` metadata block.
const today = new Date().toISOString().slice(0, 10)
const header = `% NEOMOUSE(1) neomouse 0.0.1 | User Commands
%
% ${today}
`
const markdown = `${header}\n${sections.map((s) => s.body.trim()).join("\n\n")}\n`

let man: string
try {
  man = execFileSync("pandoc", ["-s", "-f", "markdown", "-t", "man"], {
    encoding: "utf8",
    input: markdown,
  })
} catch {
  console.error(
    "pandoc not found. Enter the dev shell (`direnv allow` / `nix develop`) which provides it."
  )
  process.exit(1)
}

writeFileSync(outFile, man)
console.log(`wrote ${outFile}`)
console.log("diff against the hand-written page, then promote when happy:")
console.log("  diff ../man/neomouse.1 ../man/neomouse.1.generated")
