<script setup lang="ts">
import { Motion } from "motion-v"

/**
 * Scroll-driven entrance: fades + rises into view once. `delay` staggers items
 * in a list. Motion for Vue automatically no-ops under prefers-reduced-motion.
 * Renders a <div>; use the `class` prop to style the wrapper.
 */
withDefaults(defineProps<{ delay?: number; y?: number; class?: string }>(), {
  delay: 0,
  y: 24,
})
</script>

<template>
  <Motion
    :class="$props.class"
    :initial="{ opacity: 0, y }"
    :while-in-view="{ opacity: 1, y: 0 }"
    :in-view-options="{ once: true, margin: '-80px' }"
    :transition="{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }"
  >
    <slot />
  </Motion>
</template>
