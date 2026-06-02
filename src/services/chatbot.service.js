const deepseekRepository = require("../repositories/deepseek.repository");
const telegramRepository = require("../repositories/telegram.repository");
const chatHistory = require("../models/chatHistory");
const logger = require("../utils/logger");

const HELP_MESSAGE = `🤖 Bot Deepseek AI

Perintah tersedia:
/help - Tampilkan bantuan ini
/reset - Reset chat history (mulai percakapan baru)

Kirim pesan apapun untuk chat dengan AI!`;

/**
 * Handle incoming telegram message
 * @param {object} message - Telegram message object
 * @returns {Promise<string>} - Response message
 */
async function handleMessage(message) {
  try {
    const userId = message.from.id;
    const text = message.text.trim();
    const chatId = message.chat.id;

    // Ensure user session exists
    await chatHistory.getOrCreateSession(userId);

    // Handle commands
    if (text === "/help") {
      return HELP_MESSAGE;
    }

    if (text === "/reset") {
      await chatHistory.clearChatHistory(userId);
      return "✅ Chat history telah direset. Mulai percakapan baru!";
    }

    // Handle regular chat message
    return await handleChatMessage(userId, text);
  } catch (error) {
    logger.error(`Error handling message: ${error.message}`);
    return `❌ Error: ${error.message}`;
  }
}

/**
 * Handle regular chat message to Deepseek
 * @param {number} userId - Telegram user ID
 * @param {string} userMessage - User's message
 * @returns {Promise<string>} - AI response
 */
async function handleChatMessage(userId, userMessage) {
  try {
    // Save user message to history
    await chatHistory.addMessage(userId, "user", userMessage);

    // Get chat history for context
    const history = await chatHistory.getChatHistory(userId);

    // Convert history to messages format for Deepseek
    const messages = history.map((msg) => ({
      role: msg.role,
      content: msg.content
    }));

    // Call Deepseek API
    const systemPrompt = "You are a helpful assistant. Respond in the same language as the user's question.";
    const result = await deepseekRepository.askQuestionWithHistory(messages, systemPrompt);

    // Save assistant response to history
    await chatHistory.addMessage(userId, "assistant", result.answer);

    logger.info(`Chat processed for user ${userId}`);
    return result.answer;
  } catch (error) {
    logger.error(`Error in handleChatMessage: ${error.message}`);
    return `❌ Error: ${error.message}`;
  }
}

module.exports = {
  handleMessage
};
