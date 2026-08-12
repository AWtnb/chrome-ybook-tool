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
    const popupPath = isXIntentUrl(url) ? "./xtree.html" : "./popup.html";
    const iconPath =
      isYBookPageUrl(url) || isXIntentUrl(url)
        ? "./icons/cremesoda_128.png"
        : "./icons/cremesoda_128_gray.png";

    browser.action.setPopup({ popup: popupPath }).then(() => {
      browser.action.setIcon({ path: iconPath });
    });
  };

  browser.tabs.onActivated.addListener((activeInfo) => {
    browser.tabs.get(activeInfo.tabId, (tab) => {
      if (!tab.url) return;
      updateConfig(tab.url);
    });
  });

  browser.tabs.onUpdated.addListener((_, change, tab) => {
    if (!tab.active || !change.url || !tab.url) return;
    updateConfig(tab.url);
  });

  const getUrlToGET = (): Promise<string> => {
    return new Promise((resolve) => {
      browser.storage.sync.get("gasUrl", (result) => {
        const gasUrl = (result as { gasUrl?: string }).gasUrl;
        resolve(gasUrl || "");
      });
    });
  };

  browser.runtime.onMessage.addListener(async (msg: Message) => {
    if (msg.to !== "background" || !msg.payload) {
      return;
    }
    const m: Message = {
      to: "popup",
      type: "finished-sheet-register",
      payload: null,
    };

    const gasUrl = await getUrlToGET();
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
    urlParams.set("page", msg.payload.content);
    ["y", "m", "d", "title", "author", "detail"].forEach((p, i) => {
      urlParams.set(p, msg.payload!.params[i]);
    });
    url.search = urlParams.toString();

    // https://blog.freks.jp/gas-post-trouble-shooting/
    fetch(url.toString(), {
      method: "GET",
      mode: "cors",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            "ERROR: Failed to contact with Google Apps Script: " +
              response.status,
          );
        }
      })
      .then(() => {
        m.payload = {
          content: "ok",
          enabled: false,
          params: [],
        };
        broadcast(m);
      })
      .catch((err: unknown) => {
        const e = err instanceof Error ? err : new Error(String(err));
        m.payload = {
          content: e.message,
          enabled: false,
          params: [],
        };
        broadcast(m);
      });

    return true;
  });
});
