<script setup lang="ts">
import {
  Camera,
  Grid3x3,
  Keyboard,
  Monitor,
  MousePointer2,
  SlidersHorizontal,
} from "@lucide/vue"
import type { Component } from "vue"
import Reveal from "@/components/Reveal.vue"
import { FEATURES } from "@/data/site"

// Map the data's icon names to imported components — tree-shakeable, typed,
// and no dynamic-import gymnastics.
const icons: Record<string, Component> = {
  Camera,
  Grid3x3,
  Keyboard,
  Monitor,
  MousePointer2,
  SlidersHorizontal,
}
</script>

<template>
  <section
    id="features"
    class="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6"
  >
    <Reveal class="mx-auto max-w-2xl text-center">
      <h2 class="font-mono font-bold text-3xl tracking-tight sm:text-4xl">
        Everything, from the home row
      </h2>
      <p class="mt-4 text-muted-foreground">
        No modifier gymnastics. Mode-based, just like Vim — the status icon in
        your menu bar tells you where you are.
      </p>
    </Reveal>

    <div class="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Reveal
        v-for="(feature, i) in FEATURES"
        :key="feature.title"
        :delay="i * 0.06"
        class="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-term-green/40"
      >
        <div
          class="mb-4 inline-flex size-11 items-center justify-center rounded-lg border border-term-green/30 bg-term-green/10 text-term-green transition-transform group-hover:scale-110"
        >
          <component :is="icons[feature.icon]" class="size-5" />
        </div>
        <h3 class="font-mono font-semibold text-lg">{{ feature.title }}</h3>
        <p class="mt-2 text-muted-foreground text-sm leading-relaxed">
          {{ feature.body }}
        </p>
      </Reveal>
    </div>
  </section>
</template>
