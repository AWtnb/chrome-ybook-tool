export const MESSAGE_TYPES = {
  SHEET_REGISTER: "sheet-register",
  X_POST_CONTENT: "x-post-content",
  X_TREE_CONTENT: "x-tree-content",
  X_JUHAN_CONTENT: "x-juhan-content",
  META_CONTENT: "meta-content",
  THREADS_CONTENT: "threads-content",
  GENPON: "genpon",
  HASSO: "hasso",
  GENERAL_INFO: "general-info",
  MINIMAL_INFO: "minimal-info",
} as const;

export type MessageType =
  | (typeof MESSAGE_TYPES)[keyof typeof MESSAGE_TYPES]
  | "";

export type Payload = {
  content: string;
  enabled: boolean;
  params: string[];
};

export const isYBookPageUrl = (url: string): boolean => {
  const u = new URL(url);
  return u.host == "www.yuhikaku.co.jp" && u.pathname.startsWith("/book/");
};

export const isXIntentUrl = (url: string): boolean => {
  const u = new URL(url);
  return (
    u.host == "x.com" &&
    u.pathname == "/intent/post" &&
    u.searchParams.has("text") &&
    u.searchParams.has("bid")
  );
};
