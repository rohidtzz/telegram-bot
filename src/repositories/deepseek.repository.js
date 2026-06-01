const axios = require("axios");
const { DEEPSEEK_API_KEY } = require("../config");

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";

async function askQuestion(question, systemPrompt = null) {
  if (!DEEPSEEK_API_KEY) {
    throw new Error("DEEPSEEK_API_KEY is not configured");
  }

  const defaultSystemPrompt = "You are a helpful assistant. Respond in the same language as the user's question.";
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

module.exports = {
  askQuestion
};
