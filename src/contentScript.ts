'use strict';

import {
  AuthorInfo,
  BookMetaInfo,
  BookSeries,
  BookTitleInfo,
  FILLER,
} from './pageParser';

const getBookTitleElems = (): HTMLElement[] => {
  return Array.from(
    document.querySelectorAll<HTMLElement>('#cont_box_title2_1 > h1 > span')
  );
};

const BOOK_TITLE_INFO = new BookTitleInfo(getBookTitleElems());

const AUTHORS = (() => {
  const elem = document.querySelector<HTMLElement>('#cont_box_txt1 > h2');
  const ai = new AuthorInfo(elem);
  return ai;
})();

const getMetaInfo = (): string => {
  const elem = document.querySelector<HTMLElement>('#cont_box_txt1 > span');
  const t = elem?.innerText || '';
  return t;
};

const BOOK_META_INFO = new BookMetaInfo(getMetaInfo());
const PUBDATE = BOOK_META_INFO.getTimeStamp();

const getSeriesInfo = (): string => {
  const e = document.querySelector<HTMLElement>(
    '#cont_box_right > div.cont_box_txt1_2 a'
  );
  return e ? e.innerText : '';
};

const BOOK_SERIES = new BookSeries(getSeriesInfo());

const BOOK_MINIMAL_INFO = `『${BOOK_TITLE_INFO.getMain()}』（${AUTHORS.getFull()}）`;

const BASE_TWEET = (() => {
  const tagsLine = [
    '有斐閣',
    BOOK_SERIES.format(),
    BOOK_TITLE_INFO.getRevisionType(),
  ]
    .filter((t) => t.length)
    .map((t) => '#' + t)
    .join(' ');
  const detailLine = `${BOOK_MINIMAL_INFO} ${PUBDATE.M}月${PUBDATE.D}日発売予定！`;
  return [tagsLine, detailLine].join('\n');
})();

const ADDITIONAL_TWEET = `書誌情報はこちら：\n${document.location}`;

const JUHAN_TWEET = (() => {
  const bookLine =
    `#有斐閣 ${BOOK_SERIES.format()} ${BOOK_MINIMAL_INFO}`.replace(
      /\s+/g,
      ' '
    );
  return [bookLine, `第${FILLER}刷 #重版 しました！`, document.location].join('\n');
})();

const getGenres = (): string[] => {
  const ss: string[] = [];
  const elems = Array.from(
    document.querySelectorAll<HTMLElement>('.txt12 h2 > a')
  );
  elems.forEach((elem) => {
    elem.innerText
      .split('・')
      .map((s) => s.trim().replace(/（.+?）/g, ''))
      .forEach((s) => {
        if (!ss.includes(s)) {
          ss.push(s);
        }
      });
  });
  return ss;
};

const INSTA_FB_THREADS_POST = (() => {
  const pubdateLine = ` ${PUBDATE.M}月${PUBDATE.D}日発売予定！`;
  const tags = [
    '有斐閣',
    BOOK_SERIES.format(),
    BOOK_TITLE_INFO.getRevisionType(),
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
    BOOK_MINIMAL_INFO,
    pubdateLine,
    '',
    document.location,
    '',
    tagsLine,
  ].join('\n');
})();

const GENPON_RECORD = [
  `（${getGenres()[0]}）`,
  BOOK_TITLE_INFO.getMain(),
  BOOK_SERIES.forGenpon(),
  AUTHORS.getMember().join('・'),
  `${PUBDATE.Y}.${PUBDATE.M}.${PUBDATE.D}`,
].join('\t');

const HASSO_RECORD = [
  BOOK_META_INFO.getFiveCode(),
  `${PUBDATE.Y}年${PUBDATE.M}月`,
  BOOK_TITLE_INFO.getMain(),
  BOOK_META_INFO.getPrice(),
].join('\t');

chrome.runtime.onMessage.addListener((request) => {
  let content: string;
  let enabled: boolean;
  switch (request.type) {
    case 'slack-slash-command':
      content = `/hatsubai ${document.location.href}`;
      enabled = 0 < PUBDATE.D.length;
      break;
    case 'x-post-content':
      content = BASE_TWEET;
      enabled = 0 < PUBDATE.D.length;
      break;
    case 'x-thread-content':
      content = ADDITIONAL_TWEET;
      enabled = 0 < PUBDATE.D.length;
      break;
    case 'meta-content':
      content = INSTA_FB_THREADS_POST;
      enabled = 0 < PUBDATE.D.length;
      break;
    case 'threads-content':
      content = INSTA_FB_THREADS_POST;
      enabled = 0 < PUBDATE.D.length;
      break;
    case 'x-juhan-content':
      content = JUHAN_TWEET;
      enabled = PUBDATE.D.length < 1;
      break;
    case 'genpon':
      content = GENPON_RECORD;
      enabled = true;
      break;
    case 'hasso':
      content = HASSO_RECORD;
      enabled = true;
      break;
    default:
      content = '';
      enabled = false;
      break;
  }

  chrome.runtime.sendMessage(
    {
      payload: {
        type: request.type,
        content: content,
        enabled: enabled,
      },
    },
    () => {}
  );
});
