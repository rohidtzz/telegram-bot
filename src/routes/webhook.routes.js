const express = require("express");
const router = express.Router();
const webhookController = require("../controllers/webhook.controller");

/**
 * POST /webhooks/telegram
 * Receive webhook updates from Telegram
 * This endpoint does NOT require authentication
 */
router.post("/telegram", webhookController.handleTelegramWebhook);

module.exports = router;
