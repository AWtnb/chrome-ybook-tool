'use strict';

import { isXIntentUrl, isYBookPageUrl, RequestType } from './helper';
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
import { Payload } from './popup';

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
  const detailLine = `${getBookMinimalInfo} ${ts.M}月${ts.D}日発売予定！`;
  return [tagsLine, detailLine].join('\n');
};

const getJuhanTweet = () => {
  const bookLine = `#有斐閣 ${getBookSeries()} ${getBookMinimalInfo}`.replace(
    /\s+/g,
    ' '
  );
  return [bookLine, `第${FILLER}刷 #重版 しました！`, document.location].join(
    '\n'
  );
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
    getBookMinimalInfo,
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
    `${getBookSeries()} ${getBookMinimalInfo}`.trim(),
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
    `${getBookSeries()} ${getBookMinimalInfo}`.trim(),
  ].join(' ');
};

const replyToPopup = (payload: Payload) => {
  chrome.runtime.sendMessage(
    {
      payload: {
        type: payload.type,
        content: payload.content,
        enabled: payload.enabled,
        params: payload.params,
      },
    },
    () => {
      if (chrome.runtime.lastError) {
        console.log('something happened: ', chrome.runtime.lastError.message);
      }
    }
  );
};

chrome.runtime.onMessage.addListener((request) => {
  const p: Payload = {
    type: '',
    content: '',
    enabled: false,
    params: [],
  };

  if (isXIntentPage() && request.type == 'XTreeContent') {
    const u = new URL(document.location.href);
    const isbn = u.hash.substring(1);
    p.content = `書誌情報はこちら：\nhttps://www.yuhikaku.co.jp/books/detail/${isbn}`;
    p.enabled = true;
    replyToPopup(p);
    return;
  }

  if (!isYBookPage()) {
    return;
  }

  const ts = getTimeStamp();
  if (request.type == 'SlackSlashCommand') {
    p.content = `/hatsubai ${document.location.href}`;
    p.enabled = 0 < ts.D.length;
    replyToPopup(p);
    return;
  }
  if (request.type == 'XPostContent') {
    p.content = getMainTweet();
    p.enabled = 0 < ts.D.length;
    p.params.push(getISBN());
    replyToPopup(p);
    return;
  }
  if (request.type == 'MetaContent') {
    p.content = getFacebookThreadsPost();
    p.enabled = 0 < ts.D.length;
    replyToPopup(p);
    return;
  }
  if (request.type == 'ThreadsContent') {
    p.content = getFacebookThreadsPost();
    p.enabled = 0 < ts.D.length;
    replyToPopup(p);
    return;
  }
  if (request.type == 'XJuhanContent') {
    p.content = getJuhanTweet();
    p.enabled = ts.D.length < 1;
    replyToPopup(p);
    return;
  }
  if (request.type == 'Genpon') {
    p.content = getGenponRecordLine();
    p.enabled = true;
    replyToPopup(p);
    return;
  }
  if (request.type == 'Hasso') {
    p.content = getHassoIraishoLine();
    p.enabled = true;
    replyToPopup(p);
    return;
  }
  if (request.type == 'GeneralInfo') {
    p.content = getGeneralInfoToShare();
    p.enabled = true;
    replyToPopup(p);
    return;
  }
  if (request.type == 'MinimalInfo') {
    p.content = getMinimalInfoToShare();
    p.enabled = true;
    replyToPopup(p);
    return;
  }
});
