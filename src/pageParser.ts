export const FILLER: string = '〓';

export const getISBN = (): string => {
  const u = new URL(document.location.href);
  const s = u.pathname.split('/').at(-1);
  if (s && s.startsWith('9784641') && s.length == 13) {
    return s;
  }
  return '';
};

const getBookTitleInfo = (target: 'main' | 'sub' | 'rev'): string => {
  const elems = Array.from(
    document.querySelectorAll<HTMLElement>('#cont_box_title2_1 > h1 > span')
  );
  const clsName = (() => {
    if (target == 'main') return 'goods_goods_name';
    if (target == 'sub') return 'goods_subtitle_last_name';
    return 'goods_last_version';
  })();
  return (
    elems
      .filter((el) => el.classList.contains(clsName))
      .at(0)
      ?.innerText?.trim() || ''
  );
};

export const getBookTitle = (): string => {
  return (getBookTitleInfo('main') + ' ' + getBookTitleInfo('rev')).trim();
};

export const getBookSubTitle = (): string => {
  return getBookTitleInfo('sub').replace(' -- ', '');
};

export const getBookRevisionType = (): string => {
  if (0 < getBookTitleInfo('rev').length) {
    return '改訂版';
  }
  return '新刊';
};

export const getAuthors = (): string[] => {
  return Array.from(
    document.querySelectorAll<HTMLElement>('#cont_box_txt1 > h2 a')
  ).map((el) => {
    return el.innerText.replace(/\s/g, '');
  });
};

export const getAuthorsLine = (): string => {
  const stack: string[] = [];
  Array.from(
    document.querySelectorAll<HTMLElement>('#cont_box_txt1 > h2 a')
  ).map((el) => {
    const name = el.innerText.replace(/\s/g, '');
    stack.push(name);
    const next = el.nextSibling;
    if (!next) return;
    if (next.nodeName !== '#text') return;
    const nv = next.nodeValue;
    if (!nv) return;
    const i = nv.lastIndexOf('／');
    if (i == -1) return;
    stack.push(nv.substring(i));
  });
  return stack
    .reduce((accum: string, s: string) => {
      if (s.startsWith('／')) {
        accum += s;
        accum += '，';
        return accum;
      }
      if (accum && !accum.endsWith('，')) {
        accum += '・';
      }
      accum += s;
      return accum;
    }, '')
    .replace(/，$/, '');
};

const getMetaInfoLines = (): string[] => {
  const elem = document.querySelector<HTMLElement>('#cont_box_txt1 > span');
  return elem?.innerText?.split(/[\r\n]+/) || [];
};

type PubDate = {
  Y: string;
  M: string;
  D: string;
};

export const getTimeStamp = (): PubDate => {
  const lines = getMetaInfoLines();
  const line = lines.filter((l) => l.indexOf('年') != -1).at(0) || '';
  const ss = line.replace(/.発売/, '').split(/[年月]/);
  const d = 2 < ss.length ? ss[2] : '';
  return { Y: ss[0], M: String(Number(ss[1])), D: d };
};

export const getPrice = (): string => {
  return (
    getMetaInfoLines()
      .filter((l) => l.indexOf('定価') != -1)
      .at(0)
      ?.replace(/定価.+本体/, '')
      .replace(/円）/, '')
      .trim() || ''
  );
};

export const getFiveCode = (): string => {
  const line =
    getMetaInfoLines()
      .filter((l) => l.indexOf('ISBN') != -1)
      .at(0) || '';
  const pattern = '978-4-641-';
  const offset = line.indexOf(pattern) + pattern.length;
  return line.substring(offset, offset + 5);
};

const getSeriesBase = (): string => {
  const e = document.querySelector<HTMLElement>(
    '#cont_box_right > div.cont_box_txt1_2 a'
  );
  if (!e) return '';
  return e.innerText
    .replace(/有斐閣/g, '')
    .replace(/-/g, '')
    .replace(/\s+/g, '_')
    .replace(/[\]］]$/g, '')
    .replace(/[\[［]/g, '_');
};

export const getBookSeries = (): string => {
  const s = getSeriesBase();
  if (s == 'yknot') return '有斐閣' + s;
  return s;
};

export const getBookSeriesForGenpon = (): string => {
  const s = getBookSeries();
  if (s.length < 1) return '';
  const f = s.replace(/_/g, '').replace(/^有斐閣/, '');
  if (f.length < 1) return '';
  return `［${f}］`;
};

export const getGenres = (): string[] => {
  const elems = Array.from(
    document.querySelectorAll<HTMLElement>('.txt12 h2 > a')
  );
  return elems
    .map((elem) => {
      return elem.innerText
        .split('・')
        .map((s) => s.trim().replace(/（.+?）/g, ''));
    })
    .flat()
    .reduce((accum: string[], s: string) => {
      if (accum.indexOf(s) == -1) {
        accum.push(s);
      }
      return accum;
    }, []);
};
