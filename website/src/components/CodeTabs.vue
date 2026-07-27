<script setup lang="ts">
import { Check, Copy } from "@lucide/vue"
import { useClipboard, useResizeObserver } from "@vueuse/core"
import { Motion } from "motion-v"
import { computed, onMounted, ref, watch } from "vue"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Animated code tabs (Vue port of Animate UI's Code Tabs): a header of language
 * tabs with a sliding active-indicator, a copy button, and a panel that fades
 * the snippet in on switch. Comment lines are dimmed in lieu of full syntax
 * highlighting (keeps Shiki out of the client bundle).
 */
interface CodeTab {
  id: string
  label: string
  code: string
  blurb?: string
}

const props = defineProps<{ tabs: readonly CodeTab[] }>()

const activeId = ref(props.tabs[0]?.id ?? "")
const active = computed(
  () => props.tabs.find((t) => t.id === activeId.value) ?? props.tabs[0]
)
const lines = computed(() => (active.value?.code ?? "").split("\n"))

const { copy, copied } = useClipboard({ copiedDuring: 1600 })

// Slide a highlight pill under the active tab. Measured from the DOM so it
// stays correct on resize / font changes — no dependency on layout animations.
const listEl = ref<HTMLElement>()
const tabEls = ref<HTMLElement[]>([])
const indicator = ref({ left: 0, width: 0 })

function setTab(el: unknown, index: number) {
  if (el instanceof HTMLElement) tabEls.value[index] = el
}
function updateIndicator() {
  const index = props.tabs.findIndex((t) => t.id === activeId.value)
  const el = tabEls.value[index]
  if (el) indicator.value = { left: el.offsetLeft, width: el.offsetWidth }
}

onMounted(updateIndicator)
watch(activeId, updateIndicator)
useResizeObserver(listEl, updateIndicator)

const isComment = (line: string) => line.trimStart().startsWith("#")
</script>

<template>
  <div class="overflow-hidden rounded-xl border border-border bg-card">
    <div class="flex items-center justify-between gap-2 border-border/60 border-b pr-1">
      <div ref="listEl" role="tablist" class="relative flex">
        <span
          class="absolute inset-y-1 rounded-md bg-term-green/12 transition-all duration-300 ease-out"
          :style="{ left: `${indicator.left}px`, width: `${indicator.width}px` }"
          aria-hidden="true"
        />
        <button
          v-for="(tab, i) in tabs"
          :key="tab.id"
          :ref="(el) => setTab(el, i)"
          role="tab"
          type="button"
          :aria-selected="tab.id === activeId"
          :class="
            cn(
              'relative z-10 px-4 py-2.5 font-mono font-medium text-sm transition-colors',
              tab.id === activeId
                ? 'text-term-green'
                : 'text-muted-foreground hover:text-foreground'
            )
          "
          @click="activeId = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>

      <Button
        variant="ghost"
        size="sm"
        :aria-label="copied ? 'Copied' : 'Copy to clipboard'"
        @click="copy(active?.code ?? '')"
      >
        <Check v-if="copied" class="text-term-green" />
        <Copy v-else />
        {{ copied ? "Copied" : "Copy" }}
      </Button>
    </div>

    <p
      v-if="active?.blurb"
      class="border-border/60 border-b px-4 py-2 font-mono text-muted-foreground text-xs"
    >
      {{ active.blurb }}
    </p>

    <div class="relative">
      <Motion
        :key="activeId"
        :initial="{ opacity: 0, y: 8 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }"
      >
        <pre
          class="overflow-x-auto p-4 font-mono text-sm leading-relaxed"
        ><code><div v-for="(line, i) in lines" :key="i" :class="isComment(line) ? 'text-muted-foreground' : ''">{{ line || " " }}</div></code></pre>
      </Motion>
    </div>
  </div>
</template>
