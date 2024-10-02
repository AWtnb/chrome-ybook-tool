export enum RequestType {
  'SlackSlashCommand' = 'slack-slash-command',
  'XPostContent' = 'x-post-content',
  'XThreadContent' = 'x-thread-content',
  'XJuhanContent' = 'x-juhan-content',
  'MetaContent' = 'meta-content',
  'ThreadsContent' = 'threads-content',
  'Genpon' = 'genpon',
  'Hasso' = 'hasso',
}

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
