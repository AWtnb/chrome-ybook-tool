/**
 * 指定したサイトでのみポップアップを有効化する
 * https://geniusium.hatenablog.com/entry/2023/05/04/082017
 */
'use strict';

import { isYBookPageUrl, isXIntentUrl, Message, broadcast } from './helper';

const updateConfig = (url: string) => {
  const popupPath = (() => {
    if (isYBookPageUrl(url)) return './popup.html';
    if (isXIntentUrl(url)) return './xtree.html';
    return 'justjump.html';
  })();

  const iconPath =
    isYBookPageUrl(url) || isXIntentUrl(url)
      ? './icons/cremesoda_128.png'
      : './icons/cremesoda_128_gray.png';
  chrome.action.setPopup({ popup: popupPath }).then(() => {
    chrome.action.setIcon({ path: iconPath });
  });
};

chrome.tabs.onActivated.addListener((activeInfo: chrome.tabs.TabActiveInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab: chrome.tabs.Tab) => {
    if (!tab.url) {
      return;
    }
    updateConfig(tab.url);
  });
});

chrome.tabs.onUpdated.addListener(
  (_: number, change: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
    if (!tab.active || !change.url || !tab.url) {
      return;
    }
    updateConfig(tab.url);
  }
);

const getUrlToGET = (): Promise<string> => {
  return new Promise((resolve) => {
    chrome.storage.sync.get('gasUrl', (result) => {
      resolve(result.gasUrl || '');
    });
  });
};

chrome.runtime.onMessage.addListener(async (msg: Message) => {
  if (msg.to !== 'background' || !msg.payload) {
    return;
  }
  const m: Message = {
    to: 'popup',
    type: 'finished-sheet-register',
    payload: null,
  };

  const gasUrl = await getUrlToGET();
  if (!gasUrl) {
    m.payload = {
      content: 'ERROR: No url to GET is specified!',
      enabled: false,
      params: [],
    };
    broadcast(m);
    return;
  }

  const url = new URL(gasUrl);
  const urlParams = new URLSearchParams();
  urlParams.set('page', msg.payload.content);
  ['y', 'm', 'd', 'title', 'author', 'detail'].forEach((p, i) => {
    urlParams.set(p, msg.payload!.params[i]);
  });
  url.search = urlParams.toString();

  // https://blog.freks.jp/gas-post-trouble-shooting/
  fetch(url, {
    method: 'GET',
    mode: 'cors',
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(
          'ERROR: Failed to contact with Google Apps Script: ' + response.status
        );
      }
    })
    .then(() => {
      m.payload = {
        content: 'ok',
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
