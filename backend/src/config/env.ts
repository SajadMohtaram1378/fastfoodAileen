import dotenv from "dotenv";
dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || "5000",
  LOG_DIR: process.env.LOG_DIR || "logs",
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
  JWT_SECRET: process.env.JWT_SECRET || "your-secret",
};