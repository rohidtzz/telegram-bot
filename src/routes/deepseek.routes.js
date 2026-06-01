const express = require("express");
const router = express.Router();
const deepseekService = require("../services/deepseek.service");
const logger = require("../utils/logger");

/**
 * POST /api/deepseek/ask
 * Send question to Deepseek AI
 * Body: { question, systemPrompt? }
 */
router.post("/ask", async (req, res) => {
  try {
    const { question, systemPrompt } = req.body;

    const result = await deepseekService.askQuestion(question, systemPrompt);

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error(`Failed to process Deepseek request: ${error.message}`);
    
    let statusCode = 500;
    let message = "Failed to process request";

    if (error.message.includes("is required")) {
      statusCode = 400;
      message = error.message;
    } else if (error.message.includes("not configured")) {
      statusCode = 400;
      message = error.message;
    }

    return res.status(statusCode).json({
      success: false,
      message,
      error: error.message
    });
  }
});

module.exports = router;
