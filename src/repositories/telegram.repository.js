const axios = require("axios");
const { BOT_TOKEN } = require("../config");

function buildTelegramUrl(method) {
  return `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;
}

async function sendMessage(chatId, text, parseMode = null) {
  const payload = {
    chat_id: chatId,
    text
  };

  // Add parse_mode if specified (Markdown or MarkdownV2)
  if (parseMode) {
    payload.parse_mode = parseMode;
  }

  const response = await axios.post(buildTelegramUrl("sendMessage"), payload);

  return response.data;
}

async function getUpdates(offset = 0) {
  try {
    const response = await axios.get(buildTelegramUrl("getUpdates"), {
      params: {
        offset: offset,
        timeout: 0
      },
      timeout: 35000
    });
    return response.data.result || [];
  } catch (error) {
    throw new Error(`Failed to get updates: ${error.message}`);
  }
}

async function downloadFile(fileId) {
  try {
    // Get file info from Telegram
    const fileResponse = await axios.post(buildTelegramUrl("getFile"), {
      file_id: fileId
    });

    if (!fileResponse.data.ok || !fileResponse.data.result.file_path) {
      throw new Error("Failed to get file path from Telegram");
    }

    const filePath = fileResponse.data.result.file_path;
    const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;

    // Download file
    const fileResponse2 = await axios.get(fileUrl, {
      responseType: "arraybuffer",
      timeout: 30000
    });

    return Buffer.from(fileResponse2.data);
  } catch (error) {
    throw new Error(`Failed to download file from Telegram: ${error.message}`);
  }
}

module.exports = {
  sendMessage,
  getUpdates,
  downloadFile
};
