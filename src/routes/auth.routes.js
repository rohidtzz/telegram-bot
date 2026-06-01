const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");

/**
 * POST /auth/login
 * Generate access token and refresh token
 */
router.post("/login", authController.login);

/**
 * POST /auth/refresh
 * Get new access token using refresh token
 */
router.post("/refresh", authController.refresh);

/**
 * POST /auth/logout
 * Invalidate refresh token
 */
router.post("/logout", authController.logout);

module.exports = router;
