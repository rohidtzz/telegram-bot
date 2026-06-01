const express = require("express");
const router = express.Router();
const telegramController = require("../controllers/telegram.controller");
const { verifyToken } = require("../middleware/auth");
/**
 * POST /api/telegram/send
 * Send message to Telegram
 */
router.post("/send", verifyToken, telegramController.sendMessage);

/**
 * GET /api/telegram/updates
 * Get Telegram updates
 */
router.get("/updates", verifyToken, telegramController.getUpdates);

module.exports = router;
