import { browser } from "wxt/browser";

export type MessageType =
  | "sheet-register"
  | "finished-sheet-register"
  | "x-post-content"
  | "x-tree-content"
  | "x-juhan-content"
  | "meta-content"
  | "threads-content"
  | "genpon"
  | "hasso"
  | "general-info"
  | "minimal-info"
  | "";

export type Payload = {
  content: string;
  enabled: boolean;
  params: string[];
};

export type Message = {
  to: "popup" | "content" | "background";
  type: MessageType;
  payload: Payload | null;
};

export const broadcast = (m: Message) => {
  browser.runtime.sendMessage(m);
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
