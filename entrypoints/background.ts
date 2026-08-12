import { defineBackground } from "wxt/utils/define-background";
import {
  isYBookPageUrl,
  isXIntentUrl,
  type Message,
  broadcast,
} from "../utils/helper";
import { browser } from "wxt/browser";

export default defineBackground(() => {
  const updateConfig = (url: string) => {
    // const popupPath = isXIntentUrl(url) ? "./xtree.html" : "./popup.html";
    // const iconPath =
    //   isYBookPageUrl(url) || isXIntentUrl(url)
    //     ? "./icons/cremesoda_128.png"
    //     : "./icons/cremesoda_128_gray.png";
    // browser.action.setPopup({ popup: popupPath }).then(() => {
    //   browser.action.setIcon({ path: iconPath });
    // });
  };

  browser.tabs.onActivated.addListener((activeInfo) => {
    browser.tabs.get(activeInfo.tabId).then((tab) => {
      if (!tab.url) return;
      updateConfig(tab.url);
    });
  });

  browser.tabs.onUpdated.addListener((_, change, tab) => {
    if (!tab.active || !change.url || !tab.url) return;
    updateConfig(tab.url);
  });

  const getGasUrl = async (): Promise<string> => {
    const result = await browser.storage.sync.get("gasUrl");
    return (result as { gasUrl?: string }).gasUrl ?? "";
  };

  const handleSheetRegister = async (msg: Message) => {
    const m: Message = {
      to: "popup",
      type: "finished-sheet-register",
      payload: null,
    };

    const gasUrl = await getGasUrl();
    if (!gasUrl) {
      m.payload = {
        content:
          "エラー！ Googleスプレッドシートに記録するためのURLが未設定です。アイコンを右クリックして「オプション」から設定してください。",
        enabled: false,
        params: [],
      };
      broadcast(m);
      return;
    }

    const url = new URL(gasUrl);
    const urlParams = new URLSearchParams();
    urlParams.set("page", msg.payload!.content);
    ["y", "m", "d", "title", "author", "detail"].forEach((p, i) => {
      urlParams.set(p, msg.payload!.params[i]);
    });
    url.search = urlParams.toString();

    try {
      const response = await fetch(url.toString(), {
        method: "GET",
        mode: "cors",
      });
      if (!response.ok) {
        throw new Error(
          "ERROR: Failed to contact with Google Apps Script: " +
            response.status,
        );
      }
      m.payload = { content: "ok", enabled: false, params: [] };
    } catch (err: unknown) {
      const e = err instanceof Error ? err : new Error(String(err));
      m.payload = { content: e.message, enabled: false, params: [] };
    }

    broadcast(m);
  };

  browser.runtime.onMessage.addListener((msg: Message) => {
    if (msg.to !== "background" || !msg.payload) return;
    handleSheetRegister(msg).catch(console.error);
    return true;
  });
});
