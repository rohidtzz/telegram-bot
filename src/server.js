require("dotenv").config();
const express = require("express");
const { PORT, BOT_TOKEN, DEEPSEEK_API_KEY } = require("./config");
const logger = require("./utils/logger");

// Routes
const authRoutes = require("./routes/auth.routes");
const telegramRoutes = require("./routes/telegram.routes");
const deepseekRoutes = require("./routes/deepseek.routes");

const app = express();

// Middleware
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint (no auth required)
app.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Service is running"
  });
});

// Auth routes (no auth required)
app.use("/auth", authRoutes);

// Protected routes - require access token
app.use("/api/telegram", telegramRoutes);
app.use("/api/deepseek", deepseekRoutes);

// 404 handler
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "Endpoint not found"
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`);
  return res.status(500).json({
    success: false,
    message: "Internal server error",
    error: err.message
  });
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`✓ Server started on port ${PORT}`);
  logger.info(`✓ JWT Auth enabled`);
  logger.info(`✓ Telegram Bot Token configured: ${BOT_TOKEN ? "✓" : "✗"}`);
  logger.info(`✓ Deepseek API Key configured: ${DEEPSEEK_API_KEY ? "✓" : "✗"}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully...");
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down gracefully...");
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
});

module.exports = app;

