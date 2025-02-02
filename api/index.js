const express = require("express");
const { body, query, validationResult } = require("express-validator");
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
 * getQuizData処理用のバリデーション
 */
const getValidation = [
  query("id")
    .isNumeric()
    .withMessage("id must be a number.")
    .custom((value) => value >= 0)
    .withMessage("id must be 0 or greater.")
    .custom((value) => value < quizData.length)
    .withMessage("id must be less than " + quizData.length + "."),
];

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

app.get("/get_quizdata", getValidation, (req, res) => {
  getQuizData(req, res);
});

app.get("/get_quizcount", (req, res) => {
  getQuizCount(req, res);
});

app.post("/send_question", postValidation, (req, res) => {
  sendWebhook(req, res, responseMode.question);
});

app.post("/send_answer", postValidation, (req, res) => {
  sendWebhook(req, res, responseMode.answer);
});

// サーバの開始
app.listen(3000, () => console.log("Server ready on port 3000."));

function getQuizData(req, res) {
  /**
   * バリデーション結果
   */
  const errors = validationResult(req);

  // バリデーションでエラーが発生した場合の処理
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  /**
   * 問題番号
   * @type {number}
   */
  const id = req.query.id;

  try {
    res.json(quizData[id]);
  } catch (error) {
    res.status(500).json({
      error: error.message || "An unknown error occurred.",
    });
  }
}

function getQuizCount(req, res) {
  try {
    res.json({ count: quizData.length });
  } catch (error) {
    res.status(500).json({
      error: error.message || "An unknown error occurred.",
    });
  }
}

/**
 * Webhookを送信する処理
 * @param {*} req
 * @param {*} res
 * @param {responseMode} mode レスポンスモード
 * @return {void}
 */
async function sendWebhook(req, res, mode) {
  /**
   * バリデーション結果
   */
  const errors = validationResult(req);

  // バリデーションでエラーが発生した場合の処理
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id, count, webhook_url: webhookUrl } = req.body;

  /**
   * Webhookに送信する文字列
   */
  let message = "";

  if (mode === responseMode.question) {
    message = generateQuestion(id, count);
  } else {
    message = generateAnswer(id, count);
  }

  try {
    /**
     * Webhook送信処理のエラーを格納
     */
    const error = await sendWebhookApi(message, webhookUrl);
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
 * @param {string} message メッセージ
 * @param {string} webhookUrl WebhookURL
 * @return {*}
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

/**
 * 問題文を生成する処理
 * @param {number} id 問題の開始番号
 * @param {number} count 出題数
 * @return {string} 問題文
 */
function generateQuestion(id, count) {
  let content = "--------------------\n";
  for (let i = 0; i < count; i++) {
    let j = (id + i) % quizData.length;
    content =
      content +
      "Q" +
      j +
      ": " +
      quizData[j].question +
      "\n" +
      `解答はこちら: https://shige-it-quiz-frontend-next.vercel.app/?id=${j}` +
      "\n\n";
  }
  return content;
}

/**
 * 解答を生成する処理
 * @param {number} id 問題の開始番号
 * @param {number} count 出題数
 * @return {string} 解答
 */
function generateAnswer(id, count) {
  let content = "--------------------\n";
  for (let i = 0; i < count; i++) {
    let j = (id + i) % quizData.length;
    content = content + "Q" + j + ": " + quizData[j].answer + "\n";
    if (quizData[j].alternativeAnswers) {
      content = content + "他の解答: [ ";
      for (let k = 0; k < quizData[j].alternativeAnswers.length; k++) {
        content = content + quizData[j].alternativeAnswers[k];
        if (k < quizData[j].alternativeAnswers.length - 1) {
          content += ", ";
        }
      }
      content += " ]\n";
    }
    content += "\n";
  }
  return content;
}
