const express = require("express");
const cors = require("cors");
const path = require("path");

// JSONを読み込む
const fileName = "it-quiz-v1.6.0.json"
const quizData = require(path.resolve("./data/" + fileName));
// console.log(quizData)

// expressインスタンスの作成
const app = express();

// CORS設定
app.use(cors());

// エントリポイントの定義
app.get("/", (req, res) => {
  res.send({ message: "Hello, World." });
});

// サーバの開始
app.listen(3000, () => console.log("Server ready on port 3000."));

module.exports = app;
