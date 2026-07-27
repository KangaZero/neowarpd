<script setup lang="ts">
import GitHubIcon from "@/components/icons/GitHubIcon.vue"
import { SITE } from "@/data/site"
</script>

<template>
  <footer class="border-border/60 border-t">
    <div
      class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-muted-foreground text-sm sm:flex-row sm:px-6"
    >
      <p class="font-mono">
        <span class="text-term-green">❯</span> {{ SITE.name }} —
        {{ SITE.tagline }}
      </p>
      <div class="flex items-center gap-4">
        <a
          class="flex items-center gap-1.5 transition-colors hover:text-foreground"
          :href="SITE.repoUrl"
          target="_blank"
          rel="noopener noreferrer"
        >
          <GitHubIcon class="size-4" /> GitHub
        </a>
        <span class="opacity-60">{{ SITE.license }}</span>
      </div>
    </div>
  </footer>
</template>
