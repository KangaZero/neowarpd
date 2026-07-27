<script setup lang="ts">
import Reveal from "@/components/Reveal.vue"
import { MODES } from "@/data/site"
import { cn } from "@/lib/utils"

const dot = {
  amber: "bg-term-amber shadow-[0_0_8px_var(--term-amber)]",
  blue: "bg-primary shadow-[0_0_8px_var(--primary)]",
  green: "bg-term-green shadow-[0_0_8px_var(--term-green)]",
} as const
</script>

<template>
  <section id="modes" class="scroll-mt-20 border-border/60 border-y bg-card/30">
    <div class="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <Reveal class="mx-auto max-w-2xl text-center">
        <h2 class="font-mono font-bold text-3xl tracking-tight sm:text-4xl">
          Seven modes, one status dot
        </h2>
        <p class="mt-4 text-muted-foreground">
          The daemon launches in <code class="text-term-green">normal</code> and
          switches like Vim. The menu-bar icon changes color with the mode.
        </p>
      </Reveal>

      <div class="mt-14 grid gap-4 md:grid-cols-2">
        <Reveal
          v-for="(mode, i) in MODES"
          :key="mode.id"
          :delay="(i % 2) * 0.06"
          class="rounded-xl border border-border bg-background/60 p-6"
        >
          <div class="flex items-center gap-2.5">
            <span :class="cn('size-2.5 rounded-full', dot[mode.accent])" />
            <h3 class="font-mono font-semibold text-lg">{{ mode.name }}</h3>
          </div>
          <p class="mt-2 text-muted-foreground text-sm leading-relaxed">
            {{ mode.summary }}
          </p>
          <ul v-if="mode.binds.length" class="mt-4 flex flex-wrap gap-1.5">
            <li
              v-for="bind in mode.binds.slice(0, 4)"
              :key="bind.keys"
              class="rounded border border-border bg-muted px-2 py-1 font-mono text-muted-foreground text-xs"
            >
              {{ bind.keys }}
            </li>
          </ul>
        </Reveal>
      </div>
    </div>
  </section>
</template>
