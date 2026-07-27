<script setup lang="ts">
import { onScopeDispose, ref } from "vue"

/**
 * Terminal-style text scramble. On hover/focus, each character cycles through
 * random glyphs and resolves to the real text left-to-right. No-ops under
 * prefers-reduced-motion.
 */
const props = defineProps<{ text: string }>()

const display = ref(props.text)
const GLYPHS = "!<>-_\\/[]{}=+*^?#________"
const DURATION = 480
let raf = 0

function scramble() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
  const target = props.text
  const start = performance.now()
  cancelAnimationFrame(raf)

  const tick = (now: number) => {
    const progress = Math.min((now - start) / DURATION, 1)
    const revealed = Math.floor(progress * target.length)
    let out = ""
    for (let i = 0; i < target.length; i += 1) {
      out +=
        i < revealed
          ? (target[i] ?? "")
          : (GLYPHS[Math.floor(Math.random() * GLYPHS.length)] ?? "")
    }
    display.value = out
    if (progress < 1) raf = requestAnimationFrame(tick)
    else display.value = target
  }
  raf = requestAnimationFrame(tick)
}

function reset() {
  cancelAnimationFrame(raf)
  display.value = props.text
}

onScopeDispose(() => cancelAnimationFrame(raf))
</script>

<template>
  <span @mouseenter="scramble" @mouseleave="reset" @focusin="scramble">{{
    display
  }}</span>
</template>
