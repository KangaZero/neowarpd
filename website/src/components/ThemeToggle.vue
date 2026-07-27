<script setup lang="ts">
import { Moon, Sun } from "@lucide/vue"
import { Button } from "@/components/ui/button"
import { toggleTheme } from "@/store"
</script>

<template>
  <Button
    class="relative overflow-hidden"
    variant="ghost"
    size="icon"
    aria-label="Toggle color theme"
    @click="toggleTheme"
  >
    <!-- Sun/Moon cross-rotate. Tailwind v4 maps rotate/scale/translate to
         independent CSS properties, so they compose cleanly with the .dark
         variant. The page-wide reveal is handled by the View Transition. -->
    <Sun
      class="size-4 rotate-0 scale-100 transition-all duration-500 dark:-rotate-90 dark:scale-0"
    />
    <Moon
      class="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 size-4 rotate-90 scale-0 transition-all duration-500 dark:rotate-0 dark:scale-100"
    />
  </Button>
</template>
