<script setup lang="ts">
/**
 * Liquid button (Vue port of Animate UI's Liquid Button): a thin accent line at
 * the bottom "fills" up to cover the whole button on hover, while the label
 * flips to the contrast colour. Springy hover/tap scale. Renders an <a> when
 * `href` is set, else a <button>.
 */
withDefaults(
  defineProps<{
    href?: string
    variant?: "primary" | "term" | "neutral"
    /** Resting height of the fill sliver. */
    fillHeight?: string
    delay?: string
  }>(),
  { delay: "0s", fillHeight: "3px", variant: "primary" }
)
</script>

<template>
  <component
    :is="href ? 'a' : 'button'"
    :href="href"
    :type="href ? undefined : 'button'"
    class="liquid"
    :data-variant="variant"
    :style="{ '--lb-fill-h': fillHeight, '--lb-delay': delay }"
  >
    <span class="fill" aria-hidden="true" />
    <span class="label"><slot /></span>
  </component>
</template>

<style scoped>
.liquid {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 2.75rem;
  padding: 0 1.5rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--lb-color);
  color: var(--lb-color);
  background: transparent;
  font-family: var(--font-mono);
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition:
    color 0.35s ease,
    transform 0.15s ease;
}

.label {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

/* The rising liquid — grows from a thin sliver to the full height on hover. */
.fill {
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  z-index: -1;
  height: var(--lb-fill-h, 3px);
  background: var(--lb-color);
  transition: height 0.4s cubic-bezier(0.22, 1, 0.36, 1);
  transition-delay: var(--lb-delay, 0s);
}

.liquid:hover {
  color: var(--lb-fg);
  transform: scale(1.05);
}
.liquid:hover .fill {
  height: 100%;
}
.liquid:active {
  transform: scale(0.95);
}
.liquid:focus-visible {
  outline: 2px solid var(--color-ring);
  outline-offset: 2px;
}

.liquid[data-variant="primary"] {
  --lb-color: var(--color-primary);
  --lb-fg: var(--color-primary-foreground);
}
.liquid[data-variant="term"] {
  --lb-color: var(--color-term-green);
  --lb-fg: var(--color-background);
}
.liquid[data-variant="neutral"] {
  --lb-color: var(--color-border);
  --lb-fg: var(--color-foreground);
}

@media (prefers-reduced-motion: reduce) {
  .liquid,
  .liquid .fill {
    transition: none;
  }
  .liquid:hover {
    transform: none;
  }
}
</style>
