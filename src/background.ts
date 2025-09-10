/**
 * 指定したサイトでのみポップアップを有効化する
 * https://geniusium.hatenablog.com/entry/2023/05/04/082017
 */
'use strict';

import { isYBookPageUrl, isXIntentUrl } from './helper';

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
