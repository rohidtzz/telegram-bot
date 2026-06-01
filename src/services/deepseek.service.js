const deepseekRepository = require("../repositories/deepseek.repository");
const logger = require("../utils/logger");

async function askQuestion(question, systemPrompt = null) {
  try {
    if (!question) {
      throw new Error("question is required");
    }

    const result = await deepseekRepository.askQuestion(question, systemPrompt);
    logger.info(`Deepseek query processed successfully`, { question: question.substring(0, 100) });
    
    return result;
  } catch (error) {
    logger.error(`Deepseek service error: ${error.message}`);
    throw error;
  }
}

module.exports = {
  askQuestion
};
