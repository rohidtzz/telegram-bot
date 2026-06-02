const axios = require("axios");
const { DEEPSEEK_API_KEY } = require("../config");

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";

async function askQuestion(question, systemPrompt = null) {
  if (!DEEPSEEK_API_KEY) {
    throw new Error("DEEPSEEK_API_KEY is not configured");
  }

  const defaultSystemPrompt = "Kamu adalah asisten yang membantu dan ramah. Selalu respond dalam bahasa Indonesia yang baik dan benar.";
  const finalSystemPrompt = systemPrompt || defaultSystemPrompt;

  const response = await axios.post(
    DEEPSEEK_API_URL,
    {
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: finalSystemPrompt
        },
        {
          role: "user",
          content: question
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`
      },
      timeout: 30000
    }
  );

  return {
    question,
    answer: response.data.choices[0].message.content.trim()
  };
}

/**
 * Ask question with chat history (for conversation context)
 * @param {array} messages - Array of message objects with role and content
 * @param {string} systemPrompt - System prompt for the AI
 * @returns {Promise<object>} - Response with answer
 */
async function askQuestionWithHistory(messages, systemPrompt = null) {
  if (!DEEPSEEK_API_KEY) {
    throw new Error("DEEPSEEK_API_KEY is not configured");
  }

  const defaultSystemPrompt = "Kamu adalah asisten yang membantu dan ramah. Selalu respond dalam bahasa Indonesia yang baik dan benar.";
  const finalSystemPrompt = systemPrompt || defaultSystemPrompt;

  // Build messages array with system prompt at the beginning
  const allMessages = [
    {
      role: "system",
      content: finalSystemPrompt
    },
    ...messages
  ];

  const response = await axios.post(
    DEEPSEEK_API_URL,
    {
      model: "deepseek-chat",
      messages: allMessages,
      temperature: 0.7,
      max_tokens: 1000
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`
      },
      timeout: 30000
    }
  );

  return {
    answer: response.data.choices[0].message.content.trim()
  };
}

module.exports = {
  askQuestion,
  askQuestionWithHistory
};
