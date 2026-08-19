import { defineConfig } from "wxt";

export default defineConfig({
  manifest: {
    name: "Chrome Ybook Tool",
    description: "書籍詳細ページから情報を抽出する",
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
