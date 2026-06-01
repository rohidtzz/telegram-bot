const telegramRepository = require("../repositories/telegram.repository");

async function sendMessage(chatId, text, parseMode = null) {
  return telegramRepository.sendMessage(chatId, text, parseMode);
}

async function getUpdates(offset = 0) {
  return telegramRepository.getUpdates(offset);
}

module.exports = {
  sendMessage,
  getUpdates
};
