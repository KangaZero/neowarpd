<script setup lang="ts">
import { AnimatePresence, Motion } from "motion-v"
import AppFooter from "@/components/AppFooter.vue"
import AppNav from "@/components/AppNav.vue"
import HintOverlay from "@/components/HintOverlay.vue"
import VimHelpOverlay from "@/components/VimHelpOverlay.vue"
import { useVimNav } from "@/composables/useVimNav"
import { ui } from "@/store"

// Install the global keymap (side effect). All navigation state lives in the
// shared `ui` store, so the overlay and the count HUD read straight from it.
useVimNav()
</script>

<template>
  <AppNav />

  <main class="min-h-dvh pt-16">
    <RouterView v-slot="{ Component }">
      <component :is="Component" />
    </RouterView>
  </main>

  <AppFooter />

  <VimHelpOverlay :open="ui.helpOpen" @close="ui.helpOpen = false" />
  <HintOverlay />

  <!-- Pending-count HUD, echoing Vim's bottom-right count display. -->
  <AnimatePresence>
    <Motion
      v-if="ui.pendingCount"
      class="fixed right-4 bottom-4 z-50 rounded-md border border-term-amber/40 bg-card/90 px-3 py-1.5 font-mono text-sm text-term-amber shadow-lg backdrop-blur"
      :initial="{ opacity: 0, y: 8 }"
      :animate="{ opacity: 1, y: 0 }"
      :exit="{ opacity: 0, y: 8 }"
    >
      {{ ui.pendingCount }}
    </Motion>
  </AnimatePresence>
</template>
