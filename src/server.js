require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const { 
  PORT, 
  JWT_SECRET, 
  JWT_REFRESH_SECRET,
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
  BOT_TOKEN, 
  DEEPSEEK_API_KEY 
} = require("./config");
const logger = require("./utils/logger");
const { verifyToken } = require("./middleware/auth");
const { saveRefreshToken, getRefreshToken, deleteRefreshToken, isTokenValid } = require("./utils/token-store");

// Routes
const telegramRoutes = require("./routes/telegram.routes");
const deepseekRoutes = require("./routes/deepseek.routes");

const app = express();

// Middleware
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint (no auth required)
app.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Service is running"
  });
});

/**
 * POST /auth/login
 * Generate access token and refresh token
 * Body: { username, password }
 */
app.post("/auth/login", (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "username and password are required"
      });
    }

    // Simple validation - in production, validate against database
    if (username === "admin" && password === "admin") {
      // Generate access token (short-lived)
      const accessToken = jwt.sign(
        { username, role: "admin", type: "access" },
        JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
      );

      // Generate refresh token (long-lived)
      const refreshToken = jwt.sign(
        { username, role: "admin", type: "refresh" },
        JWT_REFRESH_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
      );

      // Calculate refresh token expiration time
      const refreshTokenExpiresIn = REFRESH_TOKEN_EXPIRES_IN;
      let expiresAtMs;
      if (refreshTokenExpiresIn.includes("d")) {
        const days = parseInt(refreshTokenExpiresIn);
        expiresAtMs = Date.now() + (days * 24 * 60 * 60 * 1000);
      } else if (refreshTokenExpiresIn.includes("h")) {
        const hours = parseInt(refreshTokenExpiresIn);
        expiresAtMs = Date.now() + (hours * 60 * 60 * 1000);
      } else {
        expiresAtMs = Date.now() + (7 * 24 * 60 * 60 * 1000); // Default 7 days
      }

      // Store refresh token
      saveRefreshToken(refreshToken, username, username, expiresAtMs);

      logger.info(`User ${username} logged in successfully`);
      return res.status(200).json({
        success: true,
        data: {
          accessToken,
          refreshToken,
          accessTokenExpiresIn: ACCESS_TOKEN_EXPIRES_IN,
          refreshTokenExpiresIn: REFRESH_TOKEN_EXPIRES_IN
        }
      });
    }

    logger.warn(`Failed login attempt for user ${username}`);
    return res.status(401).json({
      success: false,
      message: "Invalid credentials"
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message
    });
  }
});

/**
 * POST /auth/refresh
 * Get new access token using refresh token
 * Body: { refreshToken }
 */
app.post("/auth/refresh", (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "refreshToken is required"
      });
    }

    // Verify refresh token is still valid in store
    if (!isTokenValid(refreshToken)) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is invalid or expired"
      });
    }

    // Verify refresh token signature
    try {
      jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    } catch (error) {
      deleteRefreshToken(refreshToken);
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token signature"
      });
    }

    // Decode to get username
    const decoded = jwt.decode(refreshToken);

    // Generate new access token
    const newAccessToken = jwt.sign(
      { username: decoded.username, role: decoded.role, type: "access" },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
    );

    logger.info(`Access token refreshed for user ${decoded.username}`);
    return res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
        accessTokenExpiresIn: ACCESS_TOKEN_EXPIRES_IN
      }
    });
  } catch (error) {
    logger.error(`Refresh token error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Failed to refresh token",
      error: error.message
    });
  }
});

/**
 * POST /auth/logout
 * Invalidate refresh token
 * Body: { refreshToken }
 */
app.post("/auth/logout", (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "refreshToken is required"
      });
    }

    // Delete refresh token from store
    deleteRefreshToken(refreshToken);

    logger.info("User logged out successfully");
    return res.status(200).json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    logger.error(`Logout error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Logout failed",
      error: error.message
    });
  }
});

// Protected routes - require access token
app.use("/api/telegram", verifyToken, telegramRoutes);
app.use("/api/deepseek", verifyToken, deepseekRoutes);

// 404 handler
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "Endpoint not found"
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`);
  return res.status(500).json({
    success: false,
    message: "Internal server error",
    error: err.message
  });
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`✓ Server started on port ${PORT}`);
  logger.info(`✓ JWT Auth enabled with secret: ${JWT_SECRET.substring(0, 10)}...`);
  logger.info(`✓ Telegram Bot Token configured: ${BOT_TOKEN ? "✓" : "✗"}`);
  logger.info(`✓ Deepseek API Key configured: ${DEEPSEEK_API_KEY ? "✓" : "✗"}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully...");
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down gracefully...");
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
});

module.exports = app;

