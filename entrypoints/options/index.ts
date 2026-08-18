import { browser } from "wxt/browser";

const b = document.getElementById("save");
const t = document.getElementById("gas-url") as HTMLInputElement;

b!.addEventListener("click", () => {
  const gasUrl = t.value;
  if (!gasUrl) return;
  browser.storage.sync
    .set({ gasUrl })
    .then(() => {
      b!.classList.add("finished");
    })
    .catch((err) => {
      console.error("failed to save gasUrl:", err);
    });
});

t.addEventListener("input", () => {
  b!.classList.remove("finished");
});

document.addEventListener("DOMContentLoaded", async () => {
  const data = await browser.storage.sync.get("gasUrl");
  const gasUrl = (data as { gasUrl?: string }).gasUrl;
  if (!gasUrl) return;
  t.value = gasUrl;
  t.select();
});
