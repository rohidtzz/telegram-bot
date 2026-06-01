const express = require("express");
const router = express.Router();
const telegramService = require("../services/telegram.service");
const logger = require("../utils/logger");

/**
 * POST /api/telegram/send
 * Send message to Telegram
 * Body: { chatId, message, parseMode? }
 */
router.post("/send", async (req, res) => {
  try {
    const { chatId, message, parseMode } = req.body;

    if (!chatId || !message) {
      return res.status(400).json({
        success: false,
        message: "chatId and message are required"
      });
    }

    const result = await telegramService.sendMessage(chatId, message, parseMode);

    logger.info(`Message sent to Telegram chat ${chatId}`);
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error(`Failed to send Telegram message: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: error.message
    });
  }
});

/**
 * GET /api/telegram/updates
 * Get Telegram updates
 * Query: offset?
 */
router.get("/updates", async (req, res) => {
  try {
    const offset = parseInt(req.query.offset) || 0;

    const updates = await telegramService.getUpdates(offset);

    logger.info(`Retrieved ${updates.length} Telegram updates`);
    return res.status(200).json({
      success: true,
      data: updates
    });
  } catch (error) {
    logger.error(`Failed to get Telegram updates: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Failed to get updates",
      error: error.message
    });
  }
});

module.exports = router;
