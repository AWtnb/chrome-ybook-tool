import { onMessage } from "webext-bridge/background";
import { defineBackground } from "wxt/utils/define-background";
import {
  isYBookPageUrl,
  isXIntentUrl,
  Payload,
  MESSAGE_TYPES,
} from "../utils/helper";
import { browser } from "wxt/browser";

export default defineBackground(() => {
  const updateConfig = (url: string) => {
    const popupPath = isXIntentUrl(url) ? "./xtree.html" : "./popup.html";
    const iconPath =
      isYBookPageUrl(url) || isXIntentUrl(url)
        ? "./icon-128.png"
        : "./icon-128_gray.png";
    browser.action.setPopup({ popup: popupPath }).then(() => {
      browser.action.setIcon({ path: iconPath });
    });
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

  onMessage<Payload>(
    MESSAGE_TYPES.SHEET_REGISTER,
    async ({ data }): Promise<Payload> => {
      const gasUrl = await getGasUrl();
      if (!gasUrl) {
        return {
          content:
            "エラー！ Googleスプレッドシートに記録するためのURLが未設定です。アイコンを右クリックして「オプション」から設定してください。",
          enabled: false,
          params: [],
        };
      }
      const url = new URL(gasUrl);
      const urlParams = new URLSearchParams();
      urlParams.set("page", data.content);
      ["y", "m", "d", "title", "author", "detail"].forEach((p, i) => {
        urlParams.set(p, data.params[i]);
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
        return { content: "ok", enabled: false, params: [] };
      } catch (err: unknown) {
        const e = err instanceof Error ? err : new Error(String(err));
        return { content: e.message, enabled: false, params: [] };
      }
    },
  );
});
