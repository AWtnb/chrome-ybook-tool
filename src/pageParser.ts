export class BookTitleInfo {
  private readonly innerTexts: string[];
  constructor(elems: HTMLElement[]) {
    this.innerTexts = elems.map((elem) => elem.innerText);
  }

  getMain(): string {
    return this.innerTexts[0].trim();
  }

  getSub(): string {
    const c = ' -- ';
    const found = this.innerTexts.filter((t) => t.startsWith(c));
    if (found.length) {
      return found[0].substring(c.length).trim();
    }
    return '';
  }

  getRevision(): string {
    const found = this.innerTexts.filter((t) => t.indexOf('版') != -1);
    if (found.length) {
      return found[0].trim();
    }
    return '';
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

  getWritingStyle(): string {
    if (!this.elem) {
      return '';
    }
    const ss = this.elem.innerText.trim().split('／');
    if (0 < ss.length) {
      return '／' + ss.slice(-1)[0];
    }
    return '';
  }

  getFull(): string {
    return this.getMember().join('・') + this.getWritingStyle();
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
