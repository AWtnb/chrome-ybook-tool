export type RequestType =
  | 'SlackSlashCommand'
  | 'XPostContent'
  | 'XTreeContent'
  | 'XJuhanContent'
  | 'MetaContent'
  | 'ThreadsContent'
  | 'Genpon'
  | 'Hasso'
  | 'GeneralInfo'
  | 'MinimalInfo'
  | '';

const getCheckDigit = (isbn: string): number => {
  const total = String(isbn)
    .split('')
    .map((n, i) => {
      if (i % 2 == 0) {
        return Number(n);
      }
      return Number(n) * 3;
    })
    .reduce((accum, x) => {
      return accum + Number(x);
    }, 0);
  return (10 - (total % 10)) % 10;
};

export const from5code = (code: string): string => {
  const isbn12 = `9784641${code}`;
  return `${isbn12}${getCheckDigit(isbn12)}`;
};

export const isYBookPageUrl = (url: string): boolean => {
  const u = new URL(url);
  return (
    u.host == 'www.yuhikaku.co.jp' && u.pathname.startsWith('/books/detail/')
  );
};

export const isXIntentUrl = (url: string): boolean => {
  const u = new URL(url);
  return (
    u.host == 'x.com' &&
    u.pathname == '/intent/post' &&
    u.search.startsWith('?text=') &&
    u.hash.startsWith('#9784641')
  );
};
