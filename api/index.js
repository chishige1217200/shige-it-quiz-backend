const express = require("express");
const { body, validationResult } = require("express-validator");
const cors = require("cors");
const axios = require("axios");
const path = require("path");

/**
 * クイズデータが格納されているファイル名
 * @type {string}
 */
const fileName = "it-quiz-v1.6.0.json";

/**
 * クイズデータ
 */
const quizData = require(path.resolve("./data/" + fileName));
// console.log(quizData)

/**
 * 処理共通化用のEnum
 * @enum {number}
 */
const responseMode = Object.freeze({ question: 0, answer: 1 });

/**
 * expressインスタンス
 */
const app = express();

// CORS設定
app.use(cors());

// JSONボディをパースするミドルウェア
app.use(express.json());

/**
 * sendWebhook処理用のバリデーション
 */
const postValidation = [
  // number型の0以上チェック
  body("id")
    .isNumeric()
    .withMessage("id must be a number.")
    .custom((value) => value >= 0)
    .withMessage("id must be 0 or greater."),
  // number型の1以上チェック
  body("count")
    .isNumeric()
    .withMessage("count must be a number.")
    .custom((value) => value >= 1)
    .withMessage("count must be 1 or greater."),
  // string型の必須チェック
  body("webhook_url")
    .isString()
    .withMessage("webhook_url must be a string.")
    .notEmpty()
    .withMessage("webhook_url is required."),
];

// エントリポイントの定義
app.get("/", (req, res) => {
  res.send({ message: "Hello, World." });
});

app.post("/send_question", postValidation, (req, res) => {
  sendWebhook(req, res, responseMode.question);
});

app.post("/send_answer", postValidation, (req, res) => {
  sendWebhook(req, res, responseMode.answer);
});

// サーバの開始
app.listen(3000, () => console.log("Server ready on port 3000."));

/**
 * Webhookを送信する処理
 * @param {*} req
 * @param {*} res
 * @param {responseMode} responseMode - レスポンスモード
 * @returns {void}
 */
async function sendWebhook(req, res, responseMode) {
  /**
   * バリデーション結果
   */
  const errors = validationResult(req);

  // バリデーションでエラーが発生した場合の処理
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // バリデーション成功
  const { id, count, webhook_url: webhookUrl } = req.body;

  try {
    /**
     * Webhook送信処理のエラーを格納
     */
    const error = await sendWebhookApi("test", webhookUrl);
    if (error) {
      throw error; // 明示的にエラーをスロー
    }

    res.json({
      message: "Webhook sent successfully!",
    });
  } catch (error) {
    res.status(500).json({
      error: error.message || "An unknown error occurred.",
    });
  }
}

/**
 * Webhookを送信する処理(内部API)
 * @param {string} message - メッセージ
 * @param {string} webhookUrl - WebhookURL
 * @returns {*}
 */
async function sendWebhookApi(message, webhookUrl) {
  try {
    // Webhookに送信するデータ
    const payload = {
      content: message, // メッセージ内容
    };

    // Webhookにデータを送信
    const response = await axios.post(webhookUrl, payload);
    console.log("メッセージが送信されました:", response.status);
    return null; // 正常終了
  } catch (error) {
    console.error("エラーが発生しました:", error.message);
    return error; // エラーを返す
  }
}
