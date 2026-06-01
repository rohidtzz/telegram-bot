/**
 * In-memory refresh token store
 * In production, this should be stored in a database (Redis, PostgreSQL, etc.)
 */

// Format: { [refreshToken]: { userId: string, username: string, expiresAt: number } }
const refreshTokenStore = {};

function saveRefreshToken(token, userId, username, expiresAt) {
  refreshTokenStore[token] = {
    userId,
    username,
    expiresAt
  };
}

function getRefreshToken(token) {
  return refreshTokenStore[token];
}

function deleteRefreshToken(token) {
  delete refreshTokenStore[token];
}

function isTokenValid(token) {
  const tokenData = refreshTokenStore[token];
  if (!tokenData) return false;
  
  // Check if token has expired
  if (tokenData.expiresAt < Date.now()) {
    deleteRefreshToken(token);
    return false;
  }
  
  return true;
}

function cleanupExpiredTokens() {
  const now = Date.now();
  Object.keys(refreshTokenStore).forEach((token) => {
    if (refreshTokenStore[token].expiresAt < now) {
      deleteRefreshToken(token);
    }
  });
}

// Cleanup expired tokens every hour
setInterval(cleanupExpiredTokens, 60 * 60 * 1000);

module.exports = {
  saveRefreshToken,
  getRefreshToken,
  deleteRefreshToken,
  isTokenValid
};
