import { defineConfig } from "wxt";

export default defineConfig({
  manifest: {
    name: "Chrome Ybook Tool",
    version: "0.5.2",
    description: "Get book information from page",
    permissions: ["activeTab", "tabs", "clipboardWrite", "storage"],
    commands: {
      _execute_action: {
        description: "open popup",
        suggested_key: {
          default: "Ctrl+Y",
          mac: "Ctrl+Y",
        },
      },
    },
  },
});
