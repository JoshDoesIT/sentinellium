import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Sentinellium",
    description: "The Client-Side, Privacy-Preserving AI Defense Grid",
    minimum_chrome_version: "113",
    permissions: [
      "activeTab",
      "storage",
      "scripting",
      "notifications",
      "sidePanel",
    ],
    host_permissions: ["<all_urls>"],
    content_security_policy: {
      extension_pages:
        "script-src 'self' 'wasm-unsafe-eval'; object-src 'self';",
    },
  },
});
