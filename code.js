/**
 * APIのベースURL
 * @type {string}
 */
const baseUrl = "https://shige-it-quiz-backend.vercel.app/";

/**
 * APIを叩くスケジュールの間隔設定
 * @type {number}
 */
const dayInterval = 1;

const spreadSheet = SpreadsheetApp.getActiveSpreadsheet();

// function myFunction() {
//   const sheets = spreadSheet.getSheets();
//   for (let i = 0; i < sheets.length; i++) {
//     console.log(generateJsonFromSheet(sheets[i]));
//   }
// }

/**
 * @Param {string} functionName 関数名
 * @Param {number} hours 時刻（時）
 */
function createTrigger(functionName, hours) {
  const allTriggers = ScriptApp.getProjectTriggers();
  let existingTrigger = null;

  // すでに存在する{functionName}トリガーを探す
  for (let i = 0; i < allTriggers.length; i++) {
    if (allTriggers[i].getHandlerFunction() === functionName) {
      existingTrigger = allTriggers[i];
      break;
    }
  }

  // すでに存在するトリガーがあれば削除
  if (existingTrigger !== null) {
    ScriptApp.deleteTrigger(existingTrigger);
  }

  // 新しいトリガーを作成
  var triggerDay = new Date();
  triggerDay.setDate(triggerDay.getDate() + dayInterval);
  triggerDay.setHours(hours);
  triggerDay.setMinutes(0);
  triggerDay.setSeconds(0);

  ScriptApp.newTrigger(functionName)
    .timeBased()
    .at(triggerDay)
    .create();

  // トリガー設定日時を記録
  var scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperty('Trigger set at ', triggerDay.toString());
}

/**
 * クイズの問題を投稿する処理
 */
function sendQuestion() {
  post("send_question");
  createTrigger("sendQuestion", 7);
}

/**
 * クイズの解答を投稿する処理
 */
function sendAnswer() {
  post("send_answer");
  createTrigger("sendAnswer", 21);
}

/**
 *  シート名からJSONデータを生成する処理
 * @param {string} sheetName シート名
 */
function generateJsonFromSheetName(sheetName) {
  return generateJsonFromSheet(
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName)
  );
}

/**
 * シート情報からJSONデータを生成する処理
 * @param {Sheet} sheet シート情報
 */
function generateJsonFromSheet(sheet) {
  const data = sheet.getRange(1, 1, sheet.getLastRow(), 2).getValues();

  // 配列をオブジェクトに変換
  const jsonObject = Object.fromEntries(data);

  // JSON形式に変換
  const jsonString = JSON.stringify(jsonObject, null, 2);

  return jsonString;
}

/**
 * POSTリクエストを行う処理
 * @param {string} apiName エントリポイント
 */
function post(apiName) {
  const payload = generateJsonFromSheetName(apiName);

  // オプションの設定
  const options = {
    method: "post", // POSTメソッドを指定
    contentType: "application/json", // Content-Typeを指定
    accept: "application/json", // Acceptヘッダーを指定
    payload: payload, // ペイロードをJSON文字列に変換
  };

  try {
    // URLFetchAppを使用してPOSTリクエストを送信
    const response = UrlFetchApp.fetch(baseUrl + apiName, options);

    // レスポンスの内容をログに出力
    Logger.log("Response Code: " + response.getResponseCode());
    Logger.log("Response Body: " + response.getContentText());
  } catch (e) {
    // エラーハンドリング
    Logger.log("Error: " + e.message);
  }
}
