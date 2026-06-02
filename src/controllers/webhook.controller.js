const webhookService = require("../services/webhook.service");
const logger = require("../utils/logger");

/**
 * POST /webhooks/telegram
 * Receive webhook from Telegram
 */
async function handleTelegramWebhook(req, res) {
  try {
    const update = req.body;

    if (!update || !update.update_id) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook data"
      });
    }

    // Process update asynchronously (don't wait for completion)
    webhookService.processUpdate(update).catch((error) => {
      logger.error(`Error processing webhook: ${error.message}`);
    });

    // Always return 200 OK to Telegram immediately
    return res.status(200).json({
      success: true,
      message: "Webhook received"
    });
  } catch (error) {
    logger.error(`Webhook handler error: ${error.message}`);
    // Still return 200 to prevent Telegram from retrying
    return res.status(200).json({
      success: false,
      message: "Webhook received but processing failed"
    });
  }
}

module.exports = {
  handleTelegramWebhook
};
