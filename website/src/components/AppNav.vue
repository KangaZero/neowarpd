<script setup lang="ts">
import { Menu, X } from "@lucide/vue"
import { ref, watch } from "vue"
import { useRoute } from "vue-router"
import GitHubIcon from "@/components/icons/GitHubIcon.vue"
import ThemeToggle from "@/components/ThemeToggle.vue"
import { Button } from "@/components/ui/button"
import { NAV_LINKS, SITE } from "@/data/site"

const open = ref(false)
const route = useRoute()
// Close the mobile menu whenever navigation happens.
watch(
  () => route.fullPath,
  () => (open.value = false)
)
</script>

<template>
  <header
    class="fixed inset-x-0 top-0 z-50 border-border/60 border-b bg-background/70 backdrop-blur-xl"
  >
    <nav
      class="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6"
    >
      <RouterLink
        to="/"
        class="group flex items-center gap-2 font-mono font-semibold text-base tracking-tight"
      >
        <span class="text-term-green">❯</span>
        <span>neomouse</span>
        <span
          class="h-4 w-2 animate-pulse bg-term-green group-hover:bg-primary"
          aria-hidden="true"
        />
      </RouterLink>

      <!-- Desktop links -->
      <div class="hidden items-center gap-1 md:flex">
        <Button
          v-for="link in NAV_LINKS"
          :key="link.label"
          as-child
          variant="ghost"
          size="sm"
        >
          <RouterLink :to="link.to">{{ link.label }}</RouterLink>
        </Button>
        <Button as-child variant="ghost" size="icon" aria-label="GitHub">
          <a :href="SITE.repoUrl" target="_blank" rel="noopener noreferrer">
            <GitHubIcon />
          </a>
        </Button>
        <ThemeToggle />
      </div>

      <!-- Mobile controls -->
      <div class="flex items-center gap-1 md:hidden">
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon"
          :aria-expanded="open"
          aria-label="Toggle menu"
          @click="open = !open"
        >
          <X v-if="open" />
          <Menu v-else />
        </Button>
      </div>
    </nav>

    <!-- Mobile drawer -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="-translate-y-2 opacity-0"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="-translate-y-2 opacity-0"
    >
      <div
        v-if="open"
        class="border-border/60 border-t bg-background/95 backdrop-blur-xl md:hidden"
      >
        <div class="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
          <Button
            v-for="link in NAV_LINKS"
            :key="link.label"
            as-child
            variant="ghost"
            class="justify-start"
          >
            <RouterLink :to="link.to">{{ link.label }}</RouterLink>
          </Button>
          <Button as-child variant="ghost" class="justify-start">
            <a :href="SITE.repoUrl" target="_blank" rel="noopener noreferrer">
              <GitHubIcon /> GitHub
            </a>
          </Button>
        </div>
      </div>
    </Transition>
  </header>
</template>
