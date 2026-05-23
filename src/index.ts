import dotenv from "dotenv";
dotenv.config();

import { dbConnect } from "./config/mongo";
import { createApp } from "./app";

const { app, server } = createApp();
const port = process.env.PORT || 8100;

dbConnect().catch((err) => {
  console.error("DB init error:", err);
});

if (!process.env.VERCEL) {
  server.timeout = 10 * 60 * 1000;
  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

export default app;
