"use strict";

import { browser } from "wxt/browser";
import {
  isYBookPageUrl,
  isXIntentUrl,
  MESSAGE_TYPES,
} from "../../utils/helper";
import type { Payload } from "../../utils/helper";
import { FILLER } from "../../utils/pageParser";
import { sendMessage } from "webext-bridge/popup";

const talkWithActiveTab = async (
  msgType: string,
  callback: (messageType: string, payload: Payload, tabId: number) => void,
) => {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) return;
  const u = tab.url;
  if (!u || !(isYBookPageUrl(u) || isXIntentUrl(u))) return;

  const responce: Payload | null = await sendMessage(
    msgType,
    {},
    { context: "content-script", tabId: tab.id },
  );
  if (responce !== null) {
    callback(msgType, responce, tab.id);
  }
};

const insertPreview = (msgType: string, payload: Payload) => {
  const elem = document.getElementById(msgType);
  const pre = document.createElement("pre");
  pre.classList.add("preview");
  const c = document.createElement("code");
  c.innerText = payload.content;
  pre.appendChild(c);
  elem?.insertAdjacentElement("beforebegin", pre);
};

const clearCopyStatus = () => {
  Array.from(
    document.querySelectorAll<HTMLElement>("button.with-copy"),
  ).forEach((elem) => {
    elem.classList.remove("finished");
  });
};

const copyText = (text: string, callback: () => void) => {
  clearCopyStatus();
  navigator.clipboard.writeText(text).then(callback, () => {
    console.log("failed to copy:", text);
  });
};

const setupButton = (msgType: string, payload: Payload): HTMLElement => {
  const b = document.getElementById(msgType)!;
  if (payload.enabled) {
    b.removeAttribute("disabled");
  }
  return b;
};

talkWithActiveTab(
  MESSAGE_TYPES.SHEET_REGISTER,
  (msgType: string, p: Payload, tabId: number) => {
    const button = setupButton(msgType, p);
    button.classList.remove("finished");
    button.addEventListener("click", async () => {
      button.setAttribute("disabled", "true");
      const result: Payload = await sendMessage(msgType, p, "background");
      if (result.content === "ok") {
        button!.classList.add("finished");
      } else {
        button!.removeAttribute("disabled");
        alert(result.content);
      }
    });
  },
);

talkWithActiveTab(
  MESSAGE_TYPES.X_POST_CONTENT,
  (msgType: string, p: Payload, _tabId: number) => {
    const intent = `https://x.com/intent/post?text=${encodeURIComponent(
      p.content,
    )}&bid=${p.params[0]}`;
    const button = setupButton(msgType, p);
    button?.addEventListener("click", () => {
      window.open(intent, "_blank");
    });
    insertPreview(msgType, p);
  },
);

talkWithActiveTab(
  MESSAGE_TYPES.X_TREE_CONTENT,
  (msgType: string, p: Payload, _tabId: number) => {
    const button = setupButton(msgType, p);
    button?.addEventListener("click", () => {
      copyText(p.content, () => {
        button?.classList.add("finished");
      });
    });
    insertPreview(msgType, p);
  },
);

talkWithActiveTab(
  MESSAGE_TYPES.X_JUHAN_CONTENT,
  (msgType: string, p: Payload, _tabId: number) => {
    const button = setupButton(msgType, p);
    button?.setAttribute("content", p.content);
    if (p.enabled) {
      document.getElementById("juhan-count")!.removeAttribute("disabled");
    }
    button?.addEventListener("click", () => {
      const content = button?.getAttribute("content") || "";
      const count = String(button?.getAttribute("juhan-count") || 2);
      const intent = `https://x.com/intent/post?text=${encodeURIComponent(
        content.replace(FILLER, count),
      )}`;
      window.open(intent, "_blank");
    });
  },
);

talkWithActiveTab(
  MESSAGE_TYPES.META_CONTENT,
  (msgType: string, p: Payload, _tabId: number) => {
    const button = setupButton(msgType, p);
    button?.addEventListener("click", () => {
      copyText(p.content, () => {
        const url =
          "https://business.facebook.com/latest/composer?ref=biz_web_content_manager_published_posts&asset_id=101509805373062&context_ref=POSTS&business_id=114292853233117";
        window.open(url, "_blank");
      });
    });
    insertPreview(msgType, p);
  },
);

talkWithActiveTab(
  MESSAGE_TYPES.THREADS_CONTENT,
  (msgType: string, p: Payload, _tabId: number) => {
    const button = setupButton(msgType, p);
    button?.addEventListener("click", () => {
      copyText(p.content, () => {
        const url = `https://www.threads.net/intent/post?text=${encodeURIComponent(
          p.content,
        )}`;
        window.open(url, "_blank");
      });
    });
  },
);

const setupCopyButton = (msgType: string, p: Payload, _tabId: number) => {
  const button = setupButton(msgType, p);
  button?.addEventListener("click", () => {
    copyText(p.content, () => {
      button?.classList.add("finished");
    });
  });
};

talkWithActiveTab(MESSAGE_TYPES.GENPON, setupCopyButton);
talkWithActiveTab(MESSAGE_TYPES.HASSO, setupCopyButton);
talkWithActiveTab(MESSAGE_TYPES.GENERAL_INFO, setupCopyButton);
talkWithActiveTab(MESSAGE_TYPES.MINIMAL_INFO, setupCopyButton);

document
  .getElementById("juhan-count")
  ?.addEventListener("change", (event: Event) => {
    const v = (event.target as HTMLInputElement).value;
    document
      .getElementById(MESSAGE_TYPES.X_JUHAN_CONTENT)!
      .setAttribute("juhan-count", v);
  });
