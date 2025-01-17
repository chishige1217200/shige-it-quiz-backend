const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());

app.get("/", (req, res) => {
  res.send({ message: "Hello, World." });
});

app.listen(3000, () => console.log("Server ready on port 3000."));

module.exports = app;
