export type MessageType =
  | 'sheet-register'
  | 'finished-sheet-register'
  | 'x-post-content'
  | 'x-tree-content'
  | 'x-juhan-content'
  | 'meta-content'
  | 'threads-content'
  | 'genpon'
  | 'hasso'
  | 'general-info'
  | 'minimal-info'
  | '';

export type Payload = {
  content: string;
  enabled: boolean;
  params: string[];
};

export type Message = {
  to: 'popup' | 'contentScript' | 'background';
  type: MessageType;
  payload: Payload | null;
};

export const broadcast = (m: Message) => {
  chrome.runtime.sendMessage(m);
};

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
    u.searchParams.has('text') &&
    u.searchParams.has('isbn')
  );
};
