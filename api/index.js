const express = require("express");
const { body, validationResult } = require('express-validator');
const cors = require("cors");
const path = require("path");

// JSONを読み込む
const fileName = "it-quiz-v1.6.0.json";
const quizData = require(path.resolve("./data/" + fileName));
// console.log(quizData)

// 処理共通化用のEnum
const responseMode = Object.freeze({ question: 0, answer: 1 });

// expressインスタンスの作成
const app = express();

// CORS設定
app.use(cors());

// JSONボディをパースするミドルウェア
app.use(express.json());

// エントリポイントの定義
app.get("/", (req, res) => {
  res.send({ message: "Hello, World." });
});

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

app.post("/send_question", postValidation, (req, res) => {
  sendWebhook(req, res, responseMode.question);
});

app.post("/send_answer", postValidation, (req, res) => {
  sendWebhook(req, res, responseMode.answer);
});

// サーバの開始
app.listen(3000, () => console.log("Server ready on port 3000."));

function sendWebhook(req, res, returnMode) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // バリデーション成功
  const { id, count, webhook_url: webhookUrl } = req.body;
  res.json({ message: "Validation passed!", data: { id, count, webhookUrl } });
}
