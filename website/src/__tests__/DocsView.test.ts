import { flushPromises, mount } from "@vue/test-utils"
import { describe, expect, it } from "vitest"
import { createMemoryHistory, createRouter } from "vue-router"
import DocsView from "@/pages/DocsView.vue"

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { component: DocsView, path: "/docs" },
      { component: { template: "<div />" }, path: "/" },
    ],
  })
}

describe("DocsView", () => {
  it("renders and filters without crashing when typing", async () => {
    const router = makeRouter()
    router.push("/docs")
    await router.isReady()

    const wrapper = mount(DocsView, { global: { plugins: [router] } })
    expect(wrapper.find("article").exists()).toBe(true)

    // Frontmatter titles must render in the sidebar (regression: they were
    // silently undefined, which crashed the filter on the first keystroke).
    const tabs = wrapper.findAll('[role="tablist"] button, nav button')
    expect(tabs.some((t) => t.text().includes("Getting started"))).toBe(true)

    // Typing must filter without crashing the view.
    await wrapper.get("[data-vim-search]").setValue("brew")
    await flushPromises()
    expect(wrapper.find("article").exists()).toBe(true)

    // A content-only term (not in any title) should still match via full-text.
    await wrapper.get("[data-vim-search]").setValue("screencapturekit")
    await flushPromises()
    expect(wrapper.find("article").exists()).toBe(true)
  })
})
