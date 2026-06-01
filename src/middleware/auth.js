const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");
const logger = require("../utils/logger");

/**
 * Verify access token middleware
 * Extracts and validates JWT from Authorization header
 */
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    logger.warn("No access token provided");
    return res.status(401).json({
      success: false,
      message: "No access token provided"
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn(`Invalid access token: ${error.message}`);
    
    let message = "Invalid token";
    if (error.name === "TokenExpiredError") {
      message = "Access token expired. Please refresh your token.";
    }
    
    return res.status(403).json({
      success: false,
      message
    });
  }
}

module.exports = {
  verifyToken
};
