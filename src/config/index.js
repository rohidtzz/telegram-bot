require("dotenv").config();

module.exports = {
  PORT: parseInt(process.env.PORT) || 3000,
  JWT_SECRET: process.env.JWT_SECRET || "your-secret-key-change-this",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key-change-this",
  ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN || "5m",
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  BOT_TOKEN: process.env.BOT_TOKEN || "",
  MONITORING_CHAT_ID: process.env.MONITORING_CHAT_ID || "",
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY || ""
};
