<!-- [!IMPORTANT] Human review needed — AI-generated, unreviewed. See AI_POLICY.md. -->

# neomouse website

Marketing + docs site for [neomouse](https://github.com/KangaZero/neomouse),
deployed to GitHub Pages at `https://kangazero.github.io/neomouse/`.

Fully isolated from the Swift daemon: its own Nix flake, `pnpm` toolchain,
Biome config, and CI. Nothing here touches the `swift build`.

## Stack

- **Vue 3** (`<script setup>`, TS) + **Vite** + **vue-router**
- **Tailwind CSS v4** + **shadcn-vue** (reka-ui) + **Motion for Vue** (scroll-driven)
- **Biome** (lint/format), **Vitest** (tests), **pnpm** (with a 1-week
  supply-chain release-age cooldown)
- Docs authored as Markdown in `src/docs/` — the single source of truth, also
  used to regenerate the man page via `just gen-man` (pandoc).

## Develop

```sh
direnv allow        # or: nix develop   (provides node, pnpm, just, pandoc)
pnpm install
just dev            # http://localhost:5173/neomouse/
```

| Recipe | What |
|---|---|
| `just dev` | Vite dev server |
| `just build` | production build into `dist/` (+ `404.html` SPA fallback) |
| `just preview` | serve the build exactly as Pages does |
| `just lint` / `just fix` | Biome check / write |
| `just typecheck` | `vue-tsc` |
| `just test` | Vitest |
| `just verify` | lint + typecheck + test + build (what CI runs) |
| `just gen-man` | regenerate `../man/neomouse.1.generated` from `src/docs/*.md` |

## Deploy

Push to `main` with changes under `website/**` → the root
`.github/workflows/website-pages.yml` builds and deploys to Pages.
Enable **Settings → Pages → Source: GitHub Actions** once, in the repo.

## Vim navigation

The whole site is keyboard-navigable: `j`/`k` scroll, `d`/`u` half-page,
`gg`/`G` jump, `/` searches the docs, `?` toggles the help overlay. The keymap
lives in `src/composables/useVimNav.ts`.
