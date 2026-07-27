<script setup lang="ts">
import { AnimatePresence, Motion } from "motion-v"
import { computed } from "vue"
import { useHints } from "@/composables/useHints"

const { active, hints, typed } = useHints()

// Only show hints still matching what's been typed so far.
const visible = computed(() =>
  hints.value.filter((h) => h.label.startsWith(typed.value))
)
</script>

<template>
  <AnimatePresence>
    <div
      v-if="active"
      class="pointer-events-none fixed inset-0 z-[90]"
      aria-hidden="true"
    >
      <!-- Faint macOS-glass wash so the hints read as an overlay layer. -->
      <div class="absolute inset-0 bg-background/5 backdrop-blur-[1.5px]" />

      <Motion
        v-for="hint in visible"
        :key="hint.label"
        class="absolute"
        :style="{ left: `${hint.x}px`, top: `${hint.y}px` }"
        :initial="{ opacity: 0, scale: 0.6 }"
        :animate="{ opacity: 1, scale: 1 }"
        :exit="{ opacity: 0, scale: 0.6 }"
        :transition="{ duration: 0.12 }"
      >
        <!-- Glass chip: translucent, blurred, term-green ring. -->
        <kbd
          class="-translate-x-1 -translate-y-1/2 inline-flex items-center rounded-md border border-term-green/50 bg-background/70 px-1.5 py-0.5 font-mono font-bold text-[11px] uppercase leading-none shadow-black/30 shadow-lg backdrop-blur-md"
        >
          <span class="text-muted-foreground/70">{{ typed }}</span>
          <span class="text-term-green">{{
            hint.label.slice(typed.length)
          }}</span>
        </kbd>
      </Motion>
    </div>
  </AnimatePresence>
</template>
