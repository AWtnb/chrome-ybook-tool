/**
 * 指定したサイトでのみポップアップを有効化する
 * https://geniusium.hatenablog.com/entry/2023/05/04/082017
 */
'use strict';

import {
  isYBookPageUrl,
  isXIntentUrl,
  Message,
  broadcast,
  Payload,
} from './helper';

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

chrome.runtime.onMessage.addListener((msg: Message, _, sendResponse) => {
  if (msg.to !== 'background' || !msg.payload) {
    return;
  }
  // https://blog.freks.jp/gas-post-trouble-shooting/
  const gasUrl = '';
  const url = gasUrl + '?event=' + msg.payload.content;

  const m: Message = {
    to: 'popup',
    type: 'finished-sheet-register',
    payload: null,
  };
  fetch(url, {
    method: 'GET',
    mode: 'cors',
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(
          'Failed to contact with Google Apps Script: ' + response.status
        );
      }
    })
    .then(() => {
      const p: Payload = {
        content: 'ok',
        enabled: false,
        params: [],
      };
      m.payload = p;
      broadcast(m);
    })
    .catch(() => {
      const p: Payload = {
        content: 'fail',
        enabled: false,
        params: [],
      };
      m.payload = p;
      broadcast(m);
    });

  return true;
});
