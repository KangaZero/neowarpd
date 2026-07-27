<script setup lang="ts">
import { ref } from "vue"

/**
 * A glossy "specular" button (Vue port of the React Bits effect): a glass
 * surface with a bright reflection that tracks the pointer, a fixed top gloss,
 * and a soft macOS-blue glow. Renders an <a> when `href` is given, else a
 * <button>. Content goes in the default slot.
 */
withDefaults(defineProps<{ href?: string; type?: "button" | "submit" }>(), {
  type: "button",
})

const root = ref<HTMLElement>()

function onMove(event: MouseEvent) {
  const el = root.value
  if (!el) return
  const r = el.getBoundingClientRect()
  // Feed the pointer position (relative to the button) to the specular gradient.
  el.style.setProperty("--mx", `${event.clientX - r.left}px`)
  el.style.setProperty("--my", `${event.clientY - r.top}px`)
}
</script>

<template>
  <component
    :is="href ? 'a' : 'button'"
    ref="root"
    :href="href"
    :type="href ? undefined : type"
    class="specular"
    @mousemove="onMove"
  >
    <span class="relative z-10 inline-flex items-center gap-2"><slot /></span>
  </component>
</template>

<style scoped>
.specular {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-lg);
  padding: 0 1.5rem;
  height: 2.75rem;
  font-family: var(--font-mono);
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--color-primary-foreground);
  cursor: pointer;
  /* Top-lit glossy base + soft coloured glow and a crisp inner top highlight. */
  background: linear-gradient(
    180deg,
    color-mix(in oklch, var(--color-primary) 82%, white),
    var(--color-primary)
  );
  box-shadow:
    inset 0 1px 0 color-mix(in oklch, white 55%, transparent),
    inset 0 -1px 0 color-mix(in oklch, black 20%, transparent),
    0 10px 30px -10px var(--color-primary);
  transition:
    transform 0.15s ease,
    box-shadow 0.2s ease;
}

/* Fixed top gloss — the "wet glass" sheen. */
.specular::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    color-mix(in oklch, white 40%, transparent),
    transparent 42%
  );
  pointer-events: none;
}

/* Specular reflection that follows the pointer (fades in on hover). */
.specular::after {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(
    140px circle at var(--mx, 50%) var(--my, 0%),
    color-mix(in oklch, white 60%, transparent),
    transparent 55%
  );
  opacity: 0;
  mix-blend-mode: screen;
  transition: opacity 0.25s ease;
  pointer-events: none;
}

.specular:hover {
  transform: translateY(-1px);
  box-shadow:
    inset 0 1px 0 color-mix(in oklch, white 65%, transparent),
    inset 0 -1px 0 color-mix(in oklch, black 20%, transparent),
    0 14px 36px -10px var(--color-primary);
}
.specular:hover::after {
  opacity: 1;
}
.specular:active {
  transform: translateY(0);
}
.specular:focus-visible {
  outline: 2px solid var(--color-ring);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .specular,
  .specular::after {
    transition: none;
  }
}
</style>
