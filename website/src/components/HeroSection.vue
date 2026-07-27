<script setup lang="ts">
import { ArrowRight } from "@lucide/vue"
import { Motion } from "motion-v"
import GitHubIcon from "@/components/icons/GitHubIcon.vue"
import KeyCap from "@/components/KeyCap.vue"
import SpecularButton from "@/components/SpecularButton.vue"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { HERO, SITE } from "@/data/site"

// Cursor path through the demo grid (in px, relative to the terminal body).
// Mirrors an "l l j j h k" motion sequence.
const cursorX = [0, 44, 88, 88, 88, 44, 44]
const cursorY = [0, 0, 0, 44, 88, 88, 44]
</script>

<template>
  <section class="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-24">
    <div class="bg-grid pointer-events-none absolute inset-0 -z-10" />

    <div
      class="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2"
    >
      <!-- Copy -->
      <div class="text-center lg:text-left">
        <Motion
          :initial="{ opacity: 0, y: 16 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.5 }"
        >
          <Badge variant="green" class="mb-5 font-mono">
            {{ HERO.badge }}
          </Badge>
        </Motion>

        <Motion
          as="h1"
          class="text-balance font-mono font-bold text-4xl leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl"
          :initial="{ opacity: 0, y: 20 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.5, delay: 0.05 }"
        >
          {{ HERO.titleLead }}
          <span class="text-term-green">{{ HERO.titleAccent }}</span>
        </Motion>

        <Motion
          as="p"
          class="mx-auto mt-5 max-w-lg text-balance text-muted-foreground sm:text-lg lg:mx-0"
          :initial="{ opacity: 0, y: 20 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.5, delay: 0.12 }"
        >
          {{ HERO.subtitle }}
        </Motion>

        <Motion
          class="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start"
          :initial="{ opacity: 0, y: 20 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.5, delay: 0.2 }"
        >
          <SpecularButton href="#install">
            Install <ArrowRight class="size-4" />
          </SpecularButton>
          <Button as-child size="lg" variant="outline">
            <a :href="SITE.repoUrl" target="_blank" rel="noopener noreferrer">
              <GitHubIcon /> Star on GitHub
            </a>
          </Button>
        </Motion>

        <p class="mt-6 font-mono text-muted-foreground text-xs">
          Tip: press
          <KeyCap label="?" accent="green" class="!px-1.5 !py-0.5 mx-0.5" />
          for keys,
          <KeyCap label="/" accent="green" class="!px-1.5 !py-0.5 mx-0.5" />
          to search — this whole page is Vim-navigable.
        </p>
      </div>

      <!-- Terminal demo -->
      <Motion
        class="mx-auto w-full max-w-md"
        :initial="{ opacity: 0, scale: 0.96 }"
        :animate="{ opacity: 1, scale: 1 }"
        :transition="{ duration: 0.6, delay: 0.15 }"
      >
        <div
          class="overflow-hidden rounded-xl border border-border bg-card shadow-2xl shadow-black/40"
        >
          <div class="flex items-center gap-2 border-border/60 border-b px-4 py-3">
            <span class="size-3 rounded-full bg-destructive/70" />
            <span class="size-3 rounded-full bg-term-amber/70" />
            <span class="size-3 rounded-full bg-term-green/70" />
            <span class="ml-2 font-mono text-muted-foreground text-xs">
              neomouse — normal
            </span>
          </div>

          <div class="p-6">
            <!-- 3x3 warp grid with an animated cursor -->
            <div class="relative mx-auto h-[132px] w-[132px]">
              <div
                class="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-1 opacity-40"
              >
                <span
                  v-for="i in 9"
                  :key="i"
                  class="rounded border border-border border-dashed"
                />
              </div>
              <Motion
                class="absolute size-10 rounded-md border border-term-green/60 bg-term-green/20 shadow-[0_0_16px_-2px_var(--term-green)]"
                :animate="{ x: cursorX, y: cursorY }"
                :transition="{
                  duration: 4,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: 'reverse',
                  ease: 'easeInOut',
                }"
              />
            </div>

            <div class="mt-6 flex items-center justify-center gap-2">
              <KeyCap label="h" accent="green" />
              <KeyCap label="j" accent="green" />
              <KeyCap label="k" accent="green" />
              <KeyCap label="l" accent="green" />
            </div>
          </div>
        </div>
      </Motion>
    </div>
  </section>
</template>
