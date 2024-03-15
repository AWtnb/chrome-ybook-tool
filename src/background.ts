/**
 * 指定したサイトでのみポップアップを有効化する
 * https://geniusium.hatenablog.com/entry/2023/05/04/082017
 */
'use strict';
const TARGET = 'https://www.yuhikaku.co.jp/books/detail/';

const changePopup = (url: string | undefined) => {
  if (!url) {
    return;
  }
  if (url.startsWith(TARGET)) {
    chrome.action.setPopup({ popup: './popup.html' });
  } else {
    chrome.action.setPopup({ popup: '' });
  }
};

chrome.tabs.onActivated.addListener((activeInfo: chrome.tabs.TabActiveInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab: chrome.tabs.Tab) => {
    changePopup(tab.url);
  });
});

chrome.tabs.onUpdated.addListener(
  (_: number, change: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
    if (tab.active && change.url) {
      changePopup(tab.url);
    }
  }
);
