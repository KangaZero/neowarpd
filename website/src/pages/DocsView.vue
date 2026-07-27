<script setup lang="ts">
import { Search } from "@lucide/vue"
import { type Component, computed, ref } from "vue"
import { useRoute, useRouter } from "vue-router"
import { cn } from "@/lib/utils"

interface DocFrontmatter {
  title: string
  slug: string
  order: number
}
interface DocModule {
  default: Component
  frontmatter: DocFrontmatter
}

// Compile every Markdown file in src/docs into a Vue component at build time.
// The .md files are the single source of truth (also consumed by `just gen-man`).
const modules = import.meta.glob<DocModule>("../docs/*.md", { eager: true })

const docs = Object.values(modules)
  .map((m) => ({ ...m.frontmatter, component: m.default }))
  .sort((a, b) => a.order - b.order)

const route = useRoute()
const router = useRouter()
const query = ref("")

const activeSlug = computed(
  () => (route.query.doc as string | undefined) ?? docs[0]?.slug
)
const activeDoc = computed(
  () => docs.find((d) => d.slug === activeSlug.value) ?? docs[0]
)

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return docs
  return docs.filter((d) => d.title.toLowerCase().includes(q))
})

function select(slug: string) {
  router.push({ path: "/docs", query: { doc: slug } })
}
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-12 sm:px-6">
    <div class="grid gap-10 lg:grid-cols-[16rem_1fr]">
      <!-- Sidebar / TOC -->
      <aside class="lg:sticky lg:top-24 lg:self-start">
        <div class="relative mb-4">
          <Search
            class="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground"
          />
          <input
            v-model="query"
            data-vim-search
            type="search"
            placeholder="Search docs  ( / )"
            aria-label="Search docs"
            class="w-full rounded-lg border border-border bg-card py-2 pr-3 pl-9 font-mono text-sm outline-none placeholder:text-muted-foreground focus:border-term-green/50 focus:ring-2 focus:ring-term-green/20"
          />
        </div>
        <nav class="flex flex-col gap-0.5">
          <button
            v-for="doc in filtered"
            :key="doc.slug"
            type="button"
            :class="
              cn(
                'rounded-md px-3 py-2 text-left font-mono text-sm transition-colors',
                doc.slug === activeSlug
                  ? 'bg-term-green/15 text-term-green'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )
            "
            @click="select(doc.slug)"
          >
            {{ doc.title }}
          </button>
          <p
            v-if="!filtered.length"
            class="px-3 py-2 font-mono text-muted-foreground text-sm"
          >
            no matches
          </p>
        </nav>
      </aside>

      <!-- Rendered doc -->
      <article class="prose-vim min-w-0 max-w-none">
        <component :is="activeDoc.component" v-if="activeDoc" />
      </article>
    </div>
  </div>
</template>
