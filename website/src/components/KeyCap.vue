<script setup lang="ts">
import { cn } from "@/lib/utils"

/**
 * A single physical-looking keycap. `accent` tints it to a mode color; `pressed`
 * drives the depressed state used by the animated hero demo.
 */
withDefaults(
  defineProps<{
    label: string
    accent?: "green" | "amber" | "blue" | "none"
    pressed?: boolean
    class?: string
  }>(),
  { accent: "none", pressed: false }
)

const accentRing = {
  amber:
    "border-term-amber/50 text-term-amber shadow-[0_0_12px_-2px_var(--term-amber)]",
  blue: "border-primary/50 text-primary shadow-[0_0_12px_-2px_var(--primary)]",
  green:
    "border-term-green/50 text-term-green shadow-[0_0_12px_-2px_var(--term-green)]",
  none: "border-border text-foreground",
} as const
</script>

<template>
  <kbd
    :class="
      cn(
        'inline-flex min-w-9 select-none items-center justify-center rounded-md border border-b-2 bg-card px-2 py-1.5 font-mono text-sm font-semibold transition-all duration-100',
        accentRing[accent],
        pressed
          ? 'translate-y-0.5 border-b brightness-125'
          : 'translate-y-0',
        $props.class
      )
    "
  >
    {{ label }}
  </kbd>
</template>
