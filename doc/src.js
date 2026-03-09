/*

GETリクエストされたURLの書籍の発売日をGoogleスプレッドシートに記入していく


scope as bot:
  - commands
  - chat:write
  - incoming-webhook

*/

const projectProps = PropertiesService.getScriptProperties();

const WEBHOOK_URL = projectProps.getProperty('WEBHOOK_URL');
const SHEET_ID = projectProps.getProperty('SHEET_ID');
const CHANNEL_ID = projectProps.getProperty('CHANNEL_ID');

class Monday {
  constructor() {
    const n = new Date();
    this.today = new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }
  // 今日の「次の」月曜を基準に、offset日だけ加算したDateを返す
  _dayAfterNextMonday(offset = 0) {
    const day = this.today.getDay(); // 0 = Sunday, 1 = Monday, ...
    // 次の月曜までの日数（今日が月曜でも 7 を返して「翌週」の月曜にする）
    let untilNextMonday = (1 - day + 7) % 7;
    if (untilNextMonday === 0) {
      untilNextMonday = 7;
    }
    const result = new Date(this.today);
    result.setDate(this.today.getDate() + untilNextMonday + offset);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  // 来週（月曜の0時）のタイムスタンプ（ms）
  getNext() {
    return this._dayAfterNextMonday(0).getTime();
  }

  // 来週の次の週（月曜の0時）のタイムスタンプ（ms）
  getNextOfNext() {
    return this._dayAfterNextMonday(7).getTime();
  }
}

/**
 * 記録用の Google スプレッドシートを操作するクラス
 */
class DatabaseSheet {
  constructor(sheetId) {
    const sheets = SpreadsheetApp.openById(sheetId).getSheets();
    this.logSheet = sheets[0];
    this.templateSheet = sheets[1];
  }

  // 全体のデータを取得する
  getLogData() {
    const maxRow = this.logSheet.getLastRow();
    return this.logSheet.getRange(1, 1, maxRow, 8).getValues();
  }

  // 重複を除いたデータを取得する
  getUniqueLogData() {
    const uniq = new Map();
    this.getLogData().forEach((record) => {
      uniq.set(record[1], record);
    });
    return Array.from(uniq.values());
  }

  // 投稿のテンプレートをランダムに取得する
  getTemplates() {
    const maxRow = this.templateSheet.getLastRow();
    const data = this.templateSheet.getRange(1, 1, maxRow, 1).getValues();
    const rand = Math.floor(Math.random() * maxRow);
    return String(data[rand][0]);
  }

  // 投稿用の最終的なデータを取得する
  getTweets() {
    const data = this.getUniqueLogData();

    // 来週刊行予定の書籍を取得
    const monday = new Monday();
    const rangeStart = monday.getNext();
    const rangeEnd = monday.getNextOfNext();
    const tweetsOfThisWeek = data.filter((line) => {
      const ts = new Date(`${line[2]}-${line[3]}-${line[4]}`);
      return rangeStart <= ts.getTime() && ts.getTime() < rangeEnd;
    });

    return tweetsOfThisWeek.map((line) => {
      const t = this.getTemplates();
      const title = line[5];
      const pageUrl = line[1];
      const revType = String(title).endsWith('版') ? '改訂版' : '新刊';
      const msg = t
        .replace('{{title}}', title)
        .replace('{{human}}', line[6])
        .replace('{{desc}}', line[7])
        .replace('{{type}}', revType);
      return (
        `■${line[2]}年${line[3]}月${line[4]}日` +
        '\n```\n' +
        msg +
        '\n```\n書籍ページ：' +
        pageUrl
      );
    });
  }
}

/**
 * Slack応答関連
 */

// POSTメソッドはchrome拡張機能からだと許可されていないのでGETメソッドを使用する
// https://blog.freks.jp/gas-post-trouble-shooting/
function doGet(e) {
  const dSheet = new DatabaseSheet(SHEET_ID);
  const params = e.parameter;
  dSheet.logSheet.appendRow([
    new Date(),
    params.page,
    params.y,
    params.m,
    params.d,
    params.title,
    params.author,
    params.detail,
  ]);
  return ContentService.createTextOutput(
    JSON.stringify({ status: 'success' })
  ).setMimeType(ContentService.MimeType.JSON);
}

// チャンネルに投稿する関数
const postToChannel = (hookUrl, msg) => {
  const payload = {
    text: msg,
  };
  const options = {
    method: 'POST',
    payload: JSON.stringify(payload),
  };
  UrlFetchApp.fetch(hookUrl, options);
};

const postToSlack = (sheetId, hookUrl) => {
  const dSheet = new DatabaseSheet(sheetId);
  const tweets = dSheet.getTweets();
  if (tweets.length < 1) {
    return;
  }
  postToChannel(
    hookUrl,
    '来週発売となる書籍は下記の通りです。投稿予約をしておきましょう！'
  );
  tweets.forEach((twt) => {
    postToChannel(hookUrl, twt);
  });
};

// 【定期実行】Slack投稿
function weeklyPost() {
  postToSlack(SHEET_ID, WEBHOOK_URL);
}
