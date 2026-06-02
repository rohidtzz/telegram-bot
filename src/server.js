require("dotenv").config();
const express = require("express");
const { PORT, BOT_TOKEN, DEEPSEEK_API_KEY } = require("./config");
const logger = require("./utils/logger");
const chatHistory = require("./models/chatHistory");
const pollingService = require("./services/polling.service");

const app = express();

// Middleware
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  const pollingStatus = pollingService.getStatus();
  return res.status(200).json({
    success: true,
    message: "Service is running",
    polling: pollingStatus
  });
});

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

// Initialize and start server
async function startServer() {
  try {
    // Initialize database
    await chatHistory.initializeDatabase();
    logger.info("✓ Database initialized");

    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`✓ Server started on port ${PORT}`);
      logger.info(`✓ Telegram Bot Token configured: ${BOT_TOKEN ? "✓" : "✗"}`);
      logger.info(`✓ Deepseek API Key configured: ${DEEPSEEK_API_KEY ? "✓" : "✗"}`);
    });

    // Start polling for Telegram updates
    pollingService.startPolling();
    logger.info("✓ Telegram polling started");

    // Graceful shutdown
    process.on("SIGTERM", () => {
      logger.info("SIGTERM received, shutting down gracefully...");
      pollingService.stopPolling();
      server.close(async () => {
        await chatHistory.closeDatabase();
        logger.info("Server closed");
        process.exit(0);
      });
    });

    process.on("SIGINT", () => {
      logger.info("SIGINT received, shutting down gracefully...");
      pollingService.stopPolling();
      server.close(async () => {
        await chatHistory.closeDatabase();
        logger.info("Server closed");
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
}

startServer();

module.exports = app;

