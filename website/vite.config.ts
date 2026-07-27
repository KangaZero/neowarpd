import { copyFileSync } from "node:fs"
import { fileURLToPath, URL } from "node:url"

import shiki from "@shikijs/markdown-it"
import tailwindcss from "@tailwindcss/vite"
import vue from "@vitejs/plugin-vue"
import Markdown from "unplugin-vue-markdown/vite"
import { defineConfig, type Plugin } from "vite"

// GitHub Pages has no SPA rewrite, so a hard refresh on /neomouse/docs 404s.
// Copying index.html -> 404.html makes Pages serve the app for any unknown
// path; vue-router then resolves the route client-side.
function spaFallback(): Plugin {
  return {
    closeBundle() {
      copyFileSync("dist/index.html", "dist/404.html")
    },
    name: "spa-404-fallback",
  }
}

// GitHub Pages serves this project under https://<user>.github.io/neomouse/,
// so every asset + router URL must be prefixed with the repo name. Keep this in
// sync with the router history base in src/router/index.ts.
const BASE = "/neomouse/"

export default defineConfig({
  base: BASE,
  plugins: [
    vue({ include: [/\.vue$/, /\.md$/] }),
    Markdown({
      // Docs Markdown is the single source of truth (also feeds `just gen-man`).
      // Highlight fenced code with Shiki so blocks match the terminal theme.
      async markdownItSetup(md) {
        const highlighter = await shiki({
          defaultColor: false,
          themes: { dark: "vitesse-dark", light: "github-light" },
        })
        // unplugin-vue-markdown passes a `markdown-exit` instance while
        // @shikijs/markdown-it is typed against upstream `markdown-it`; the two
        // are runtime-compatible but structurally different types, so bridge
        // the plugin to md.use's expected parameter type.
        md.use(highlighter as unknown as Parameters<typeof md.use>[0])
      },
    }),
    tailwindcss(),
    spaFallback(),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
})
