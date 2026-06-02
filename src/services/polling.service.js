const telegramRepository = require("../repositories/telegram.repository");
const chatbotService = require("./chatbot.service");
const logger = require("../utils/logger");
const { POLLING_INTERVAL } = require("../config");

let isRunning = false;
let pollingTimer = null;
let lastUpdateId = 0;

/**
 * Start polling for Telegram updates
 */
function startPolling() {
  if (isRunning) {
    logger.warn("Polling is already running");
    return;
  }

  isRunning = true;
  logger.info("Starting Telegram polling...");
  poll();
}

/**
 * Main polling loop
 */
async function poll() {
  try {
    // Get updates from Telegram
    const updates = await telegramRepository.getUpdates(lastUpdateId);

    // Process each update
    for (const update of updates) {
      try {
        // Update the last update ID
        if (update.update_id >= lastUpdateId) {
          lastUpdateId = update.update_id + 1;
        }

        // Handle the update
        await handleUpdate(update);
      } catch (error) {
        logger.error(`Error processing update ${update.update_id}: ${error.message}`);
      }
    }
  } catch (error) {
    // Extract status code from custom error or axios error
    const statusCode = error?.statusCode || error?.response?.status;
    
    // Handle 409 Conflict error (webhook still active)
    if (statusCode === 409) {
      logger.warn("Received 409 Conflict - Webhook might still be active. Attempting to delete webhook...");
      try {
        await telegramRepository.deleteWebhook();
        logger.info("Webhook deleted successfully, polling will continue");
        // Reset lastUpdateId after deleting webhook to get fresh updates
        lastUpdateId = 0;
      } catch (deleteError) {
        logger.error(`Failed to delete webhook: ${deleteError.message}`);
      }
    } else {
      logger.error(`Polling error: ${error.message}`);
    }
  } finally {
    // Schedule next poll
    if (isRunning) {
      pollingTimer = setTimeout(poll, POLLING_INTERVAL);
    }
  }
}

/**
 * Handle individual Telegram update
 * @param {object} update - Telegram update object
 */
async function handleUpdate(update) {
  try {
    const message = update.message || update.channel_post;

    if (!message) {
      return;
    }

    // Only process text messages
    if (!message.text) {
      return;
    }

    const chatId = message.chat.id;
    const userId = message.from?.id;

    logger.info(`Message from user ${userId}: ${message.text.substring(0, 50)}`);

    // Handle the message using chatbot service
    const response = await chatbotService.handleMessage(message);

    // Send response back to user
    await telegramRepository.sendMessage(chatId, response);
  } catch (error) {
    logger.error(`Error handling update: ${error.message}`);
  }
}

/**
 * Stop polling
 */
function stopPolling() {
  if (!isRunning) {
    logger.warn("Polling is not running");
    return;
  }

  isRunning = false;
  if (pollingTimer) {
    clearTimeout(pollingTimer);
    pollingTimer = null;
  }
  logger.info("Polling stopped");
}

/**
 * Get polling status
 */
function getStatus() {
  return {
    isRunning,
    lastUpdateId
  };
}

module.exports = {
  startPolling,
  stopPolling,
  getStatus
};
