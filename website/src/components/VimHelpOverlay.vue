<script setup lang="ts">
import { AnimatePresence, Motion } from "motion-v"
import KeyCap from "@/components/KeyCap.vue"

defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const groups = [
  {
    binds: [
      { desc: "page down", keys: ["j"] },
      { desc: "page up", keys: ["k"] },
      { desc: "half page down", keys: ["d"] },
      { desc: "half page up", keys: ["u"] },
      { desc: "top of page", keys: ["g", "g"] },
      { desc: "bottom of page", keys: ["G"] },
    ],
    title: "Move",
  },
  {
    binds: [
      { desc: "search the page", keys: ["/"] },
      { desc: "toggle this help", keys: ["?"] },
      { desc: "close overlays", keys: ["Esc"] },
    ],
    title: "Act",
  },
] as const
</script>

<template>
  <AnimatePresence>
    <Motion
      v-if="open"
      class="fixed inset-0 z-[100] flex items-center justify-center p-4"
      :initial="{ opacity: 0 }"
      :animate="{ opacity: 1 }"
      :exit="{ opacity: 0 }"
      :transition="{ duration: 0.15 }"
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard navigation help"
      @click.self="emit('close')"
    >
      <div class="absolute inset-0 bg-background/70 backdrop-blur-sm" />
      <Motion
        class="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl"
        :initial="{ opacity: 0, scale: 0.95, y: 8 }"
        :animate="{ opacity: 1, scale: 1, y: 0 }"
        :exit="{ opacity: 0, scale: 0.95, y: 8 }"
        :transition="{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }"
      >
        <div class="mb-4 flex items-center gap-2 font-mono font-semibold">
          <span class="text-term-green">❯</span> Page navigation
        </div>
        <div class="grid gap-5 sm:grid-cols-2">
          <div v-for="group in groups" :key="group.title">
            <p class="mb-2 font-mono text-muted-foreground text-xs uppercase">
              {{ group.title }}
            </p>
            <ul class="space-y-2">
              <li
                v-for="bind in group.binds"
                :key="bind.desc"
                class="flex items-center justify-between gap-3 text-sm"
              >
                <span class="text-muted-foreground">{{ bind.desc }}</span>
                <span class="flex gap-1">
                  <KeyCap
                    v-for="k in bind.keys"
                    :key="k"
                    :label="k"
                    accent="green"
                    class="!py-0.5 !px-1.5 !text-xs"
                  />
                </span>
              </li>
            </ul>
          </div>
        </div>
        <p class="mt-5 text-center font-mono text-muted-foreground text-xs">
          just like the daemon — press
          <KeyCap label="?" accent="green" class="!py-0.5 !px-1.5 !text-xs" />
          again to dismiss
        </p>
      </Motion>
    </Motion>
  </AnimatePresence>
</template>
