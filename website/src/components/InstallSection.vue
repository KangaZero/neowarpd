<script setup lang="ts">
import { Check, Copy } from "@lucide/vue"
import { useClipboard } from "@vueuse/core"
import { computed, ref } from "vue"
import Reveal from "@/components/Reveal.vue"
import { Button } from "@/components/ui/button"
import { INSTALL_METHODS, SITE } from "@/data/site"
import { cn } from "@/lib/utils"

const active = ref(INSTALL_METHODS[0].id)
const current = computed(
  () => INSTALL_METHODS.find((m) => m.id === active.value) ?? INSTALL_METHODS[0]
)

const { copy, copied } = useClipboard({ copiedDuring: 1600 })
</script>

<template>
  <section id="install" class="mx-auto max-w-3xl scroll-mt-20 px-4 py-20 sm:px-6">
    <Reveal class="text-center">
      <h2 class="font-mono font-bold text-3xl tracking-tight sm:text-4xl">
        Install in one line
      </h2>
      <p class="mt-4 text-muted-foreground">
        Same universal binary, three ways. Pick your poison.
      </p>
    </Reveal>

    <Reveal :delay="0.1" class="mt-10">
      <!-- Tabs -->
      <div
        role="tablist"
        aria-label="Install method"
        class="flex gap-1 rounded-lg border border-border bg-card p-1"
      >
        <button
          v-for="method in INSTALL_METHODS"
          :id="`tab-${method.id}`"
          :key="method.id"
          role="tab"
          type="button"
          :aria-selected="active === method.id"
          :aria-controls="`panel-${method.id}`"
          :class="
            cn(
              'flex-1 rounded-md px-3 py-2 font-mono font-medium text-sm transition-colors',
              active === method.id
                ? 'bg-term-green/15 text-term-green'
                : 'text-muted-foreground hover:text-foreground'
            )
          "
          @click="active = method.id"
        >
          {{ method.label }}
        </button>
      </div>

      <!-- Panel -->
      <div
        :id="`panel-${current.id}`"
        role="tabpanel"
        :aria-labelledby="`tab-${current.id}`"
        class="mt-4 overflow-hidden rounded-xl border border-border bg-card"
      >
        <div
          class="flex items-center justify-between border-border/60 border-b px-4 py-2.5"
        >
          <span class="font-mono text-muted-foreground text-xs">
            {{ current.blurb }}
          </span>
          <Button
            variant="ghost"
            size="sm"
            :aria-label="copied ? 'Copied' : 'Copy to clipboard'"
            @click="copy(current.code)"
          >
            <Check v-if="copied" class="text-term-green" />
            <Copy v-else />
            {{ copied ? "Copied" : "Copy" }}
          </Button>
        </div>
        <pre
          class="overflow-x-auto p-4 font-mono text-sm leading-relaxed"
        ><code>{{ current.code }}</code></pre>
      </div>

      <p class="mt-4 text-center text-muted-foreground text-sm">
        Prefer a manual download? Grab the tarball from the
        <a
          class="text-primary underline-offset-4 hover:underline"
          :href="SITE.releasesUrl"
          target="_blank"
          rel="noopener noreferrer"
        >
          Releases page </a
        >.
      </p>
    </Reveal>
  </section>
</template>
