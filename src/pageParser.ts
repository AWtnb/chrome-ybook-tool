export const FILLER: string = '〓';

const getInnerTextByClassName = (
  elems: HTMLElement[],
  className: string
): string => {
  const found = elems.filter((elem) => elem.classList.contains(className));
  return 0 < found.length ? found[0].innerText : '';
};

export class BookTitleInfo {
  private readonly main: string;
  private readonly sub: string;
  private readonly rev: string;
  constructor(elems: HTMLElement[]) {
    this.main = getInnerTextByClassName(elems, 'goods_goods_name');
    this.sub = getInnerTextByClassName(elems, 'goods_subtitle_last_name');
    this.rev = getInnerTextByClassName(elems, 'goods_last_version');
  }

  getMain(): string {
    return this.main.trim() + this.rev;
  }

  getSub(): string {
    return this.sub.replace(/ -- /, '');
  }

  getRevision(): string {
    return this.rev.trim();
  }

  getRevisionType(): string {
    if (this.getRevision().length) {
      return '改訂版';
    }
    return '新刊';
  }
}

export class AuthorInfo {
  private readonly elem: HTMLElement | null;
  constructor(elem: HTMLElement | null) {
    this.elem = elem;
  }

  getMember(): string[] {
    if (!this.elem) {
      return [];
    }
    return Array.from(this.elem.querySelectorAll<HTMLElement>('a')).map(
      (elem) => elem.innerText.replace(/\s/, '')
    );
  }

  getFull(): string {
    if (!this.elem) {
      return '';
    }
    const ss: string[] = [];
    Array.from(this.elem.querySelectorAll<HTMLElement>('a')).forEach((atag) => {
      const name = atag.innerText.replace(/\s/g, '');
      const ne = atag.nextSibling;
      if (!ne || ne.nodeName !== '#text') {
        ss.push(name);
        return;
      }
      const te = ne.nodeValue || '';
      if (!te.includes('／')) {
        ss.push(name);
        return;
      }
      const suf = te.replace(/^.+／/, '／');
      ss.push(name + suf + '，');
    });
    return ss.join('・').replace(/，・/g, '，').replace(/，$/, '');
  }
}

type PubDate = {
  Y: string;
  M: string;
  D: string;
};

export const parsePubDate = (s: string): PubDate => {
  const parts = s.split(/[年月]/);
  const y = String(Number(parts[0]));
  const m = String(Number(parts[1]));
  const last = String(parts[2]);
  const pd: PubDate = { Y: y, M: m, D: '' };
  if (last.match(/^\d/)) {
    pd.D = String(Number(last.replace(/[^\d]/g, '')));
  }
  return pd;
};

export class BookMetaInfo {
  private readonly lines: string[];
  constructor(text: string) {
    this.lines = text.split(/[\r\n]+/);
  }

  getTimeStamp(): PubDate {
    const found = this.lines.filter((l) => l.indexOf('年') != -1);
    const s = found.length ? found[0] : '';
    return parsePubDate(s);
  }

  getPrice(): string {
    const found = this.lines.filter((l) => String(l).indexOf('定価') != -1);
    if (found.length) {
      return found[0]
        .replace(/定価.+本体/, '')
        .replace(/円）/, '')
        .trim();
    }
    return '';
  }

  getFiveCode(): string {
    const found = this.lines.filter((l) => String(l).indexOf('ISBN') != -1);
    if (0 < found.length) {
      return found[0].replace(/^.+(\d{5}).+$/, '$1');
    }
    return '';
  }
}

export class BookSeries {
  private readonly base: string;
  constructor(text: string) {
    this.base = text
      .replace(/有斐閣/g, '')
      .replace(/-/g, '')
      .replace(/\s+/g, '_')
      .replace(/[\]］]$/g, '')
      .replace(/[\[［]/g, '_');
  }

  format(): string {
    const prefix = this.base == 'yknot' ? '有斐閣' : '';
    return prefix + this.base;
  }
  forGenpon(): string {
    const s = this.format();
    if (s.length < 1) {
      return '';
    }
    const f = s.replace(/_/g, '').replace(/^有斐閣/, '');
    return 0 < f.length ? `［${f}］` : '';
  }
}
