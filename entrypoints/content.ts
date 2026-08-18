import { onMessage } from "webext-bridge/content-script";
import { defineContentScript } from "wxt/utils/define-content-script";

import {
  isXIntentUrl,
  isYBookPageUrl,
  MESSAGE_TYPES,
  Payload,
} from "../utils/helper";
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
  isBeforeSale,
} from "../utils/pageParser";

export default defineContentScript({
  matches: ["https://www.yuhikaku.co.jp/book/b*", "https://x.com/intent/*"],
  runAt: "document_idle",
  main() {
    const isYBookPage = (): boolean => {
      return isYBookPageUrl(document.location.href);
    };

    const isXIntentPage = (): boolean => {
      return isXIntentUrl(document.location.href);
    };

    const getBookMinimalInfo = (): string => {
      return `『${getBookTitle()}』（${getAuthorsLine()}）`;
    };

    const getBookPageId = (): string => {
      const u = new URL(document.location.href);
      const leaf = u.pathname.split("/").pop();
      if (leaf) {
        return leaf.split(".")[0];
      }
      return "";
    };

    const getMainTweet = (): string => {
      const tagsLine = [
        "有斐閣",
        getBookSeries(),
        getBookRevisionType(),
        "見本出来",
      ]
        .filter((t) => t.length)
        .map((t) => "#" + t)
        .join(" ");
      const ts = getTimeStamp();
      const detailLine = `${getBookMinimalInfo()} ${ts.M}月${ts.D}日発売予定！`;
      return [tagsLine, detailLine].join("\n");
    };

    const getJuhanTweet = () => {
      const tagsLine = ["有斐閣", getBookSeries()]
        .filter((s) => 0 < s.length)
        .map((s) => "#" + s)
        .join(" ");
      return [
        `${tagsLine} ${getBookMinimalInfo()}`.replace(/\s+/g, " "),
        `第${FILLER}刷 #重版 しました！`,
        document.location.href,
      ].join("\n");
    };

    const getFacebookInstagramThreadsPost = () => {
      const ts = getTimeStamp();
      const pubdateLine = ` ${ts.M}月${ts.D}日発売予定！`;
      const tags = [
        "有斐閣",
        getBookSeries(),
        getBookRevisionType(),
        "見本出来",
        "本",
        "book",
        "bookstagram",
        "studygram",
      ];
      const tagsLine =
        tags
          .concat(getGenres())
          .filter((t) => t.length)
          .map((t) => "#" + t)
          .join(" ") +
        " " +
        "#教科書 #テキスト #textbook #出版社公式 #出版 #中の人 #装丁 #文化 #勉強 #読書 #読者垢 #大学生 #大人の勉強垢 #教養 #勉強垢さんと繋がりたい #読書好きな人と繋がりたい #本好きな人と繋がりたい";
      return [
        getBookMinimalInfo(),
        pubdateLine,
        "",
        document.location,
        "",
        tagsLine,
      ].join("\n");
    };

    const getGenponRecordLine = (): string => {
      const ts = getTimeStamp();
      return [
        `（${getGenres().join("・")}）`,
        getBookTitle(),
        getBookSeriesForGenpon(),
        getAuthors()
          .map((a) => a.name)
          .join("・"),
        `${ts.Y}.${ts.M}.${ts.D}`,
      ].join("\t");
    };

    const getHassoIraishoLine = (): string => {
      const ts = getTimeStamp();
      return [
        getFiveCode(),
        `${ts.Y}年${ts.M}月`,
        getBookTitle(),
        getPrice(),
      ].join("\t");
    };

    const getContentDetail = (): string => {
      return (
        (
          document
            .querySelector(
              "#page > div.contents-block div.book-content > div.wrap",
            )
            ?.textContent.trim() || ""
        ).trim() || ""
      );
    };

    const getGeneralInfoToShare = (): string => {
      return [
        `${getBookSeries()} ${getBookMinimalInfo()}`.trim(),
        "",
        document
          .querySelector(
            "#page > div.contents-block div.book-content > div.wrap",
          )
          ?.textContent.trim()
          .replace(/\uff0c/g, "、") || "",
        "",
        document.location,
      ].join("\n");
    };

    const getMinimalInfoToShare = (): string => {
      return [
        getFiveCode(),
        `${getBookSeries()} ${getBookMinimalInfo()}`.trim(),
      ].join(" ");
    };

    onMessage(MESSAGE_TYPES.X_TREE_CONTENT, (): Payload | null => {
      if (!isXIntentPage()) return null;
      const u = new URL(document.location.href);
      const bid = u.searchParams.get("bid");
      if (!bid) return null;
      return {
        content: `書誌情報はこちら：\nhttps://www.yuhikaku.co.jp/book/${bid}.html`,
        enabled: true,
        params: [],
      };
    });

    onMessage(MESSAGE_TYPES.SHEET_REGISTER, () => {
      if (!isYBookPage()) return null;
      const ts = getTimeStamp();
      const params: string[] = [
        ts.Y,
        ts.M,
        ts.D,
        getBookTitle(),
        getAuthorsLine(),
        getContentDetail(),
      ];
      return {
        content: document.location.href,
        enabled: isBeforeSale(),
        params: params,
      };
    });

    onMessage(MESSAGE_TYPES.X_POST_CONTENT, (): Payload | null => {
      if (!isYBookPage()) return null;
      return {
        content: getMainTweet(),
        enabled: isBeforeSale(),
        params: [getBookPageId()],
      };
    });
    onMessage(MESSAGE_TYPES.META_CONTENT, (): Payload | null => {
      if (!isYBookPage()) return null;
      return {
        content: getFacebookInstagramThreadsPost(),
        enabled: isBeforeSale(),
        params: [],
      };
    });
    onMessage(MESSAGE_TYPES.THREADS_CONTENT, (): Payload | null => {
      if (!isYBookPage()) return null;
      return {
        content: getFacebookInstagramThreadsPost(),
        enabled: isBeforeSale(),
        params: [],
      };
    });
    onMessage(MESSAGE_TYPES.X_JUHAN_CONTENT, (): Payload | null => {
      if (!isYBookPage()) return null;
      return {
        content: getJuhanTweet(),
        enabled: !isBeforeSale(),
        params: [],
      };
    });
    onMessage(MESSAGE_TYPES.GENPON, (): Payload | null => {
      if (!isYBookPage()) return null;
      return {
        content: getGenponRecordLine(),
        enabled: true,
        params: [],
      };
    });
    onMessage(MESSAGE_TYPES.HASSO, (): Payload | null => {
      if (!isYBookPage()) return null;
      return {
        content: getHassoIraishoLine(),
        enabled: true,
        params: [],
      };
    });
    onMessage(MESSAGE_TYPES.GENERAL_INFO, (): Payload | null => {
      if (!isYBookPage()) return null;
      return {
        content: getGeneralInfoToShare(),
        enabled: true,
        params: [],
      };
    });
    onMessage(MESSAGE_TYPES.MINIMAL_INFO, (): Payload | null => {
      if (!isYBookPage()) return null;
      return {
        content: getMinimalInfoToShare(),
        enabled: true,
        params: [],
      };
    });
  },
});
