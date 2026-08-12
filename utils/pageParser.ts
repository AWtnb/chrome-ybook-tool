export const FILLER: string = "〓";

const getTableDataByRowName = (name: string): string => {
  const trs = Array.from(
    document.querySelectorAll("#main div.data > table > tbody > tr"),
  );

  for (const tr of trs) {
    const th = tr.querySelector("th");
    if (th?.textContent?.trim() !== name) continue;

    const td = tr.querySelector("td");
    return td?.textContent?.trim() ?? "";
  }

  return "";
};

export const getISBN = (): string => {
  return getTableDataByRowName("ISBN");
};

const getFirstText = (element: Element): string => {
  for (const node of element.childNodes) {
    if (node.nodeType === 3) {
      return node.textContent ?? "";
    }
    if (node.nodeType === 1) {
      break;
    }
  }
  return "";
};

const getTitle = (s: string): string => {
  const elems = s.trim().split(/\s+/);
  if (1 < elems.length) {
    elems.pop();
  }
  return elems.join(" ");
};

const getRevision = (s: string): string => {
  const lastElem = s.trim().split(/\s+/).pop()!;
  if (lastElem.indexOf("版") !== -1) {
    return lastElem;
  }
  return "";
};

const getBookTitleInfo = (target: "main" | "sub" | "rev"): string => {
  const pageTitleContainer = document.querySelector(
    "#page div.contents-wrapper > div.page-title.article",
  )!;
  const titleWithRev = getFirstText(
    pageTitleContainer.querySelector("h1 > span")!,
  );
  if (target === "main") {
    return getTitle(titleWithRev);
  }
  if (target === "sub") {
    const subtitleElem = pageTitleContainer.querySelector("p.subname");
    if (!subtitleElem) return "";
    return subtitleElem.textContent.trim();
  }
  return getRevision(titleWithRev);
};

export const getBookTitle = (): string => {
  return (getBookTitleInfo("main") + " " + getBookTitleInfo("rev")).trim();
};

export const getBookSubTitle = (): string => {
  return getBookTitleInfo("sub");
};

export const getBookRevisionType = (): string => {
  if (0 < getBookTitleInfo("rev").length) {
    return "改訂版";
  }
  return "新刊";
};

type Author = { name: string; label: string };

export const getAuthors = (): Author[] => {
  return Array.from(
    document.querySelectorAll("div.book-info > div.author a"),
  ).map((el) => {
    const t = el.textContent.replace(/\s/g, "");
    const name = t.replace(/（.+）$/, "");
    const label = el.nextElementSibling?.textContent?.trim() ?? "";
    return {
      name: name,
      label: label,
    };
  });
};

export const getAuthorsLine = (): string => {
  const map = new Map<string, string[]>();
  const authors = getAuthors();
  for (const author of authors) {
    const list = map.get(author.label);
    if (list) {
      list.push(author.name);
      continue;
    }
    map.set(author.label, [author.name]);
  }

  return Array.from(map.values())
    .map((names) => names.join("・"))
    .join("，");
};

type PubDate = {
  Y: string;
  M: string;
  D: string;
};

export const getTimeStamp = (): PubDate => {
  const timestamp = getTableDataByRowName("出版年月日");
  const [y, m, d, _] = timestamp.split(/[年月日]/);
  return { Y: y, M: m, D: d };
};

export const isBeforeSale = (): boolean => {
  const elem = document.querySelector("#main > div > div.price > div.stock");
  return elem?.textContent.trim() === "刊行予定";
};

export const getPrice = (): string => {
  const base = document.querySelector(
    "#main div.price > span:nth-child(2)",
  )!.textContent;
  return base.replace(/^[^0-9]+/, "").replace(/円.+$/, "円");
};

export const getFiveCode = (): string => {
  return getISBN().substring(7).substring(0, 5);
};

export const getBookSeries = (): string => {
  const s = document
    .querySelector("#main div.data > table > tbody > tr:nth-child(2) > td")!
    .textContent.trim();
  if (s === "有斐閣ストゥディア") return "ストゥディア";
  if (s === "y-knot") return "有斐閣yknot";
  if (s === "有斐閣アルマ") return "アルマ";
  if (s === "テキストブックス［つかむ］") return "つかむ";
  if (s === "New Liberal Arts Selection") return "NewLiberalArtsSelection";
  if (s === "有斐閣ブックス") return "ブックス";
  if (s === "有斐閣Ｓシリーズ") return "Sシリーズ";
  if (s === "有斐閣コンパクト") return "コンパクト";
  if (s === "有斐閣選書") return "選書";
  if (s === "有斐閣双書") return "双書";
  if (s === "有斐閣双書キーワード") return "双書キーワード";
  if (s === "有斐閣Insight") return "インサイト";
  return "";
};

export const getBookSeriesForGenpon = (): string => {
  const s = getBookSeries();
  if (s.length < 1) return "";
  return `［${s.replace(/^有斐閣/, "")}］`;
};

export const getGenres = (): string[] => {
  const genres: string[] = [];
  Array.from(
    document.querySelectorAll(
      "#main div.data > table > tbody > tr:nth-child(1) > td a",
    ),
  )
    .map((el) => el.textContent.trim())
    .filter((t) => t.trim().startsWith("●"))
    .forEach((t) => {
      t.substring(1)
        .split(/[\s・]/)
        .forEach((s) => genres.push(s.trim()));
    });
  return genres;
};
