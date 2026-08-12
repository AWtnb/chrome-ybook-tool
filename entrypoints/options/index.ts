import { browser } from "wxt/browser";

const b = document.getElementById("save");
const t = document.getElementById("gas-url") as HTMLInputElement;

b!.addEventListener("click", () => {
  const gasUrl = t.value;
  if (gasUrl) {
    browser.storage.sync.set({ gasUrl: gasUrl }).then(() => {
      b!.classList.add("finished");
    });
  }
});

t.addEventListener("input", () => {
  b!.classList.remove("finished");
});

document.addEventListener("DOMContentLoaded", () => {
  browser.storage.sync.get("gasUrl", (data) => {
    const gasUrl = (data as { gasUrl?: string }).gasUrl;
    if (gasUrl) {
      t.value = gasUrl;
      t.select();
    }
  });
});
