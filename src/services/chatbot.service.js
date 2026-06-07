const deepseekRepository = require("../repositories/deepseek.repository");
const telegramRepository = require("../repositories/telegram.repository");
const chatHistory = require("../models/chatHistory");
const logger = require("../utils/logger");
const { AVAILABLE_MODELS, DEEPSEEK_MODEL } = require("../config");

const HELP_MESSAGE = `🤖 Bot Deepseek AI

Perintah tersedia:
/help - Tampilkan bantuan ini
/reset - Reset chat history (mulai percakapan baru)
/model - Lihat atau ganti model AI

Kirim pesan apapun untuk chat dengan AI!`;

/**
 * Convert markdown format to HTML for Telegram
 * Converts **text** to <b>text</b> for bold
 * Converts *text* to <i>text</i> for italic
 * @param {string} text - Text with markdown format
 * @returns {string} - Text with HTML format
 */
function markdownToHtml(text) {
  // Convert **text** to <b>text</b>
  text = text.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
  return text;
}

/**
 * Count the ratio of printable characters in a buffer
 * Used to detect if a file is text or binary
 * @param {Buffer} buffer - File buffer
 * @returns {number} - Ratio of printable chars (0-1)
 */
function countPrintableRatio(buffer) {
  if (buffer.length === 0) return 0;
  let printable = 0;
  const sampleSize = Math.min(buffer.length, 4096);
  for (let i = 0; i < sampleSize; i++) {
    const byte = buffer[i];
    // ASCII printable (32-126) + common whitespace (9, 10, 13) + high bytes for UTF-8 (128+)
    if ((byte >= 32 && byte <= 126) || byte === 9 || byte === 10 || byte === 13 || byte >= 128) {
      printable++;
    }
  }
  return printable / sampleSize;
}

/**
 * Handle incoming telegram message
 * @param {object} message - Telegram message object
 * @returns {Promise<string|null>} - Response message or null
 */
async function handleMessage(message) {
  try {
    const userId = message.from.id;

    // Ensure user session exists
    await chatHistory.getOrCreateSession(userId);

    // Route to appropriate handler
    if (message.text) {
      return await handleTextMessage(message);
    }
    if (message.document) {
      return await handleDocumentMessage(message);
    }
    return null;
  } catch (error) {
    logger.error(`Error handling message: ${error.message}`);
    return `❌ Error: ${error.message}`;
  }
}

/**
 * Handle text message (commands & chat)
 * @param {object} message - Telegram message object
 * @returns {Promise<string>} - Response message
 */
async function handleTextMessage(message) {
  const userId = message.from.id;
  const text = message.text.trim();

  // Handle commands
  if (text === "/help") {
    return HELP_MESSAGE;
  }

  if (text === "/reset") {
    await chatHistory.clearChatHistory(userId);
    return "✅ Chat history telah direset. Mulai percakapan baru!";
  }

  if (text === "/model" || text.startsWith("/model ")) {
    return await handleModelCommand(userId, text);
  }

  // Handle regular chat message
  return await handleChatMessage(userId, text);
}

/**
 * Handle /model command - show or change AI model
 * @param {number} userId - Telegram user ID
 * @param {string} text - Full command text
 * @returns {Promise<string>} - Response message
 */
async function handleModelCommand(userId, text) {
  const currentModel = (await chatHistory.getUserModel(userId)) || DEEPSEEK_MODEL;
  const args = text.split(" ").filter(Boolean);

  // /model without args — show current model & available models
  if (args.length === 1) {
    const modelList = AVAILABLE_MODELS.map((m) => {
      const marker = m === currentModel ? " ✅ (dipakai)" : "";
      return `• \`${m}\`${marker}`;
    }).join("\n");

    return `🤖 <b>Model AI</b>\n\nModel saat ini: <b>${currentModel}</b>\n\nModel tersedia:\n${modelList}\n\nGunakan <code>/model &lt;nama_model&gt;</code> untuk ganti model.\nContoh: <code>/model deepseek-v4-flash</code>`;
  }

  // /model <model_name> — switch model
  const requestedModel = args[1].toLowerCase();

  // Find matching model (case-insensitive)
  const matchedModel = AVAILABLE_MODELS.find(
    (m) => m.toLowerCase() === requestedModel
  );

  if (!matchedModel) {
    const modelList = AVAILABLE_MODELS.map((m) => `• \`${m}\``).join("\n");
    return `❌ Model <b>${args[1]}</b> tidak dikenal.\n\nModel tersedia:\n${modelList}`;
  }

  await chatHistory.setUserModel(userId, matchedModel);

  return `✅ Model berhasil diganti ke <b>${matchedModel}</b>`;
}

/**
 * Handle document/file message
 * Accepts all text-based files, rejects binary
 * @param {object} message - Telegram message object with document
 * @returns {Promise<string>} - Response message
 */
async function handleDocumentMessage(message) {
  const userId = message.from.id;
  const doc = message.document;
  const fileName = doc.file_name || "unknown";
  const fileId = doc.file_id;
  const fileSize = doc.file_size || 0;

  // Reject files larger than 5 MB
  const MAX_SIZE = 5 * 1024 * 1024;
  if (fileSize > MAX_SIZE) {
    const sizeMB = (fileSize / (1024 * 1024)).toFixed(1);
    return `❌ File terlalu besar (${sizeMB} MB). Maksimal <b>5 MB</b>.`;
  }

  try {
    // Download file from Telegram
    const fileBuffer = await telegramRepository.downloadFile(fileId);

    // Try to decode as UTF-8 text, replace invalid chars
    const fileContent = fileBuffer.toString("utf-8");

    // Check if content looks like readable text (not purely binary)
    const printableRatio = countPrintableRatio(fileBuffer);
    if (printableRatio < 0.5 || !fileContent.trim()) {
      if (!fileContent.trim()) {
        return "❌ File kosong, tidak ada teks yang bisa diproses.";
      }
      return `❌ File <b>${fileName}</b> tidak bisa dibaca sebagai teks (binary).\n\nHanya file berbasis teks yang didukung (.txt, .md, .json, .csv, .log, .xml, .js, .py, .html, .css, .sql, .sh, .yml, .env, dll).`;
    }

    logger.info(`File "${fileName}" downloaded (${fileContent.length} chars)`);

    // Build labeled content: include caption if present
    const caption = message.caption || "";
    let labeledContent = `[File: ${fileName}]`;
    if (caption.trim()) {
      labeledContent += `\n[Pesan dari user: ${caption}]`;
    }
    labeledContent += `\n\n${fileContent}`;
    await chatHistory.addMessage(userId, "user", labeledContent);

    // Get chat history for context
    const history = await chatHistory.getChatHistory(userId);
    const messages = history.map((msg) => ({
      role: msg.role,
      content: msg.content
    }));

    // Call Deepseek API
    const systemPrompt = "Kamu adalah asisten yang membantu dan ramah. Selalu respond dalam bahasa Indonesia yang baik dan benar.";
    const userModel = await chatHistory.getUserModel(userId);
    const result = await deepseekRepository.askQuestionWithHistory(messages, systemPrompt, userModel);

    // Save assistant response
    await chatHistory.addMessage(userId, "assistant", result.answer);

    logger.info(`File "${fileName}" processed for user ${userId}`);
    return markdownToHtml(result.answer);
  } catch (error) {
    logger.error(`Error handling file "${fileName}": ${error.message}`);
    return `❌ Gagal memproses file: ${error.message}`;
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

    // Call Deepseek API with Indonesian system prompt
    const systemPrompt = "Kamu adalah asisten yang membantu dan ramah. Selalu respond dalam bahasa Indonesia yang baik dan benar.";
    const userModel = await chatHistory.getUserModel(userId);
    const result = await deepseekRepository.askQuestionWithHistory(messages, systemPrompt, userModel);

    // Save assistant response to history
    await chatHistory.addMessage(userId, "assistant", result.answer);

    logger.info(`Chat processed for user ${userId}`);
    // Convert markdown format to HTML for Telegram display
    return markdownToHtml(result.answer);
  } catch (error) {
    logger.error(`Error in handleChatMessage: ${error.message}`);
    return `❌ Error: ${error.message}`;
  }
}

module.exports = {
  handleMessage
};
