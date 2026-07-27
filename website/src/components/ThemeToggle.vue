<script setup lang="ts">
import { Moon, Sun } from "@lucide/vue"
import { Button } from "@/components/ui/button"
import { theme, toggleTheme } from "@/store"
</script>

<template>
  <Button
    variant="ghost"
    size="icon"
    :aria-label="`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`"
    @click="toggleTheme"
  >
    <Moon v-if="theme === 'dark'" />
    <Sun v-else />
  </Button>
</template>
