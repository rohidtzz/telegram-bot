require("dotenv").config();

module.exports = {
  PORT: parseInt(process.env.PORT) || 3000,
  BOT_TOKEN: process.env.BOT_TOKEN || "",
  ADMIN_CHAT_ID: process.env.ADMIN_CHAT_ID || "",
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY || "",
  DEEPSEEK_MODEL: process.env.DEEPSEEK_MODEL || "deepseek-v4-flash",
  
  // Polling configuration
  POLLING_INTERVAL: 1000, // 1 second
  
  // Log level
  LOG_LEVEL: process.env.LOG_LEVEL || "info"
};
