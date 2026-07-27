import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router"

import DocsView from "@/pages/DocsView.vue"
import HomeView from "@/pages/HomeView.vue"

const routes: RouteRecordRaw[] = [
  { component: HomeView, name: "home", path: "/" },
  { component: DocsView, name: "docs", path: "/docs" },
  // Unknown paths fall back to the landing page (also the GitHub Pages
  // 404.html target — see the build step that copies index.html -> 404.html).
  { path: "/:pathMatch(.*)*", redirect: "/" },
]

export const router = createRouter({
  // Must match Vite's `base` ("/neomouse/") so links resolve under the Pages
  // subpath. import.meta.env.BASE_URL is that same value at runtime.
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { behavior: "smooth", el: to.hash, top: 80 }
    return { top: 0 }
  },
})
