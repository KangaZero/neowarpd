<script setup lang="ts">
import CodeTabs from "@/components/CodeTabs.vue"
import Reveal from "@/components/Reveal.vue"
import { INSTALL_METHODS, SITE } from "@/data/site"
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
      <CodeTabs :tabs="INSTALL_METHODS" />

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
