'use strict';

import { broadcast, isXIntentUrl, isYBookPageUrl, MessageType } from './helper';
import {
  FILLER,
  getAuthors,
  getAuthorsLine,
  getBookTitle,
  getBookRevisionType,
  getBookSeries,
  getBookSeriesForGenpon,
  getFiveCode,
  getGenres,
  getPrice,
  getTimeStamp,
  getISBN,
} from './pageParser';
import { Payload, Message } from './helper';

const isYBookPage = (): boolean => {
  return isYBookPageUrl(document.location.href);
};

const isXIntentPage = (): boolean => {
  return isXIntentUrl(document.location.href);
};

const getBookMinimalInfo = (): string => {
  return `『${getBookTitle()}』（${getAuthorsLine()}）`;
};

const getMainTweet = (): string => {
  const tagsLine = [
    '有斐閣',
    getBookSeries(),
    getBookRevisionType(),
    '見本出来',
  ]
    .filter((t) => t.length)
    .map((t) => '#' + t)
    .join(' ');
  const ts = getTimeStamp();
  const detailLine = `${getBookMinimalInfo()} ${ts.M}月${ts.D}日発売予定！`;
  return [tagsLine, detailLine].join('\n');
};

const getJuhanTweet = () => {
  const bookLine = `#有斐閣 ${getBookSeries()} ${getBookMinimalInfo()}`.replace(
    /\s+/g,
    ' '
  );
  return [
    bookLine,
    `第${FILLER}刷 #重版 しました！`,
    document.location.href,
  ].join('\n');
};

const getFacebookThreadsPost = () => {
  const ts = getTimeStamp();
  const pubdateLine = ` ${ts.M}月${ts.D}日発売予定！`;
  const tags = [
    '有斐閣',
    getBookSeries(),
    getBookRevisionType(),
    '見本出来',
    '本',
    'book',
    'bookstagram',
    'studygram',
  ];
  const tagsLine =
    tags
      .concat(getGenres())
      .filter((t) => t.length)
      .map((t) => '#' + t)
      .join(' ') +
    ' ' +
    '#教科書 #テキスト #textbook #出版社公式 #出版 #中の人 #装丁 #文化 #勉強 #読書 #読者垢 #大学生 #大人の勉強垢 #教養 #勉強垢さんと繋がりたい #読書好きな人と繋がりたい #本好きな人と繋がりたい';
  return [
    getBookMinimalInfo(),
    pubdateLine,
    '',
    document.location,
    '',
    tagsLine,
  ].join('\n');
};

const getGenponRecordLine = (): string => {
  const ts = getTimeStamp();
  return [
    `（${getGenres().join('・')}）`,
    getBookTitle(),
    getBookSeriesForGenpon(),
    getAuthors().join('・'),
    `${ts.Y}.${ts.M}.${ts.D}`,
  ].join('\t');
};

const getHassoIraishoLine = (): string => {
  const ts = getTimeStamp();
  return [getFiveCode(), `${ts.Y}年${ts.M}月`, getBookTitle(), getPrice()].join(
    '\t'
  );
};

const getGeneralInfoToShare = (): string => {
  return [
    `${getBookSeries()} ${getBookMinimalInfo()}`.trim(),
    '',
    document
      .getElementById('cont_box_m30')
      ?.innerText.replace(/\uff0c/g, '、') || '',
    '',
    document.location,
  ].join('\n');
};

const getMinimalInfoToShare = (): string => {
  return [
    getFiveCode(),
    `${getBookSeries()} ${getBookMinimalInfo()}`.trim(),
  ].join(' ');
};

const replyToPopup = (replyType: MessageType, payload: Payload) => {
  const m: Message = {
    to: 'popup',
    type: replyType,
    payload: payload,
  };
  broadcast(m);
};

chrome.runtime.onMessage.addListener((msg: Message) => {
  if (msg.to !== 'contentScript') {
    return;
  }
  const p: Payload = {
    content: '',
    enabled: false,
    params: [],
  };

  if (isXIntentPage() && msg.type == 'x-tree-content') {
    const u = new URL(document.location.href);
    const isbn = u.searchParams.get('isbn');
    if (isbn) {
      p.content = `書誌情報はこちら：\nhttps://www.yuhikaku.co.jp/books/detail/${isbn}`;
      p.enabled = true;
      replyToPopup(msg.type, p);
    }
    return;
  }

  if (!isYBookPage()) {
    return;
  }

  const ts = getTimeStamp();
  if (msg.type == 'sheet-register') {
    p.content = document.location.href;
    p.enabled = 0 < ts.D.length;
    replyToPopup(msg.type, p);
    return;
  }
  if (msg.type == 'x-post-content') {
    p.content = getMainTweet();
    p.enabled = 0 < ts.D.length;
    p.params.push(getISBN());
    replyToPopup(msg.type, p);
    return;
  }
  if (msg.type == 'meta-content') {
    p.content = getFacebookThreadsPost();
    p.enabled = 0 < ts.D.length;
    replyToPopup(msg.type, p);
    return;
  }
  if (msg.type == 'threads-content') {
    p.content = getFacebookThreadsPost();
    p.enabled = 0 < ts.D.length;
    replyToPopup(msg.type, p);
    return;
  }
  if (msg.type == 'x-juhan-content') {
    p.content = getJuhanTweet();
    p.enabled = ts.D.length < 1;
    replyToPopup(msg.type, p);
    return;
  }
  if (msg.type == 'genpon') {
    p.content = getGenponRecordLine();
    p.enabled = true;
    replyToPopup(msg.type, p);
    return;
  }
  if (msg.type == 'hasso') {
    p.content = getHassoIraishoLine();
    p.enabled = true;
    replyToPopup(msg.type, p);
    return;
  }
  if (msg.type == 'general-info') {
    p.content = getGeneralInfoToShare();
    p.enabled = true;
    replyToPopup(msg.type, p);
    return;
  }
  if (msg.type == 'minimal-info') {
    p.content = getMinimalInfoToShare();
    p.enabled = true;
    replyToPopup(msg.type, p);
    return;
  }
});
