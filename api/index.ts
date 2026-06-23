import dotenv from "dotenv";
dotenv.config();

import express from "express";
const app = express();

app.get("/", (_req, res) => {
  res.send("Server is alive");
});

export default app;
