const express = require("express");
const router = express.Router();
const deepseekController = require("../controllers/deepseek.controller");

/**
 * POST /api/deepseek/ask
 * Send question to Deepseek AI
 */
router.post("/ask", deepseekController.askQuestion);

module.exports = router;
