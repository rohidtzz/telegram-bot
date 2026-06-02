require("dotenv").config();

module.exports = {
  PORT: parseInt(process.env.PORT) || 3000,
  BOT_TOKEN: process.env.BOT_TOKEN || "",
  ADMIN_CHAT_ID: process.env.ADMIN_CHAT_ID || "",
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY || "",
  
  // Webhook configuration
  WEBHOOK_URL: process.env.WEBHOOK_URL || "http://localhost:3000/webhooks/telegram",
  
  // S3 configuration (compatible with AWS S3, Minio, DigitalOcean Spaces, etc.)
  S3_ENDPOINT: process.env.S3_ENDPOINT || "http://localhost:9000",
  S3_REGION: process.env.S3_REGION || "us-east-1",
  S3_ACCESS_KEY: process.env.S3_ACCESS_KEY || "minioadmin",
  S3_SECRET_KEY: process.env.S3_SECRET_KEY || "minioadmin",
  S3_BUCKET: process.env.S3_BUCKET || "telegram-media",
  S3_USE_SSL: process.env.S3_USE_SSL === "true" || false,
  S3_FORCE_PATH_STYLE: process.env.S3_FORCE_PATH_STYLE === "true" || true
};
