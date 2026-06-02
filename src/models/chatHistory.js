const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");
const logger = require("../utils/logger");

// Database file path
const DB_PATH = path.join(__dirname, "../../data/chat_history.db");
const DB_DIR = path.dirname(DB_PATH);

let db = null;

/**
 * Initialize database connection
 */
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    // Create data directory if it doesn't exist
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
      logger.info(`Created database directory: ${DB_DIR}`);
    }

    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        logger.error(`Failed to connect to database: ${err.message}`);
        reject(err);
      } else {
        logger.info("Connected to SQLite database");
        createTables();
        resolve();
      }
    });
  });
}

/**
 * Create tables if they don't exist
 */
function createTables() {
  db.serialize(() => {
    // Table for storing chat sessions (one per user)
    db.run(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table for storing chat messages
    db.run(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        role TEXT NOT NULL, -- 'user' or 'assistant'
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES chat_sessions(user_id)
      )
    `);

    logger.info("Database tables created or already exist");
  });
}

/**
 * Get or create chat session for a user
 * @param {number} userId - Telegram user ID
 * @returns {Promise<object>}
 */
function getOrCreateSession(userId) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT OR IGNORE INTO chat_sessions (user_id) VALUES (?)`,
      [userId],
      function (err) {
        if (err) {
          logger.error(`Failed to create session: ${err.message}`);
          reject(err);
        } else {
          db.get(
            `SELECT * FROM chat_sessions WHERE user_id = ?`,
            [userId],
            (err, row) => {
              if (err) reject(err);
              else resolve(row);
            }
          );
        }
      }
    );
  });
}

/**
 * Add message to chat history
 * @param {number} userId - Telegram user ID
 * @param {string} role - 'user' or 'assistant'
 * @param {string} content - Message content
 * @returns {Promise<void>}
 */
function addMessage(userId, role, content) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO chat_messages (user_id, role, content) VALUES (?, ?, ?)`,
      [userId, role, content],
      function (err) {
        if (err) {
          logger.error(`Failed to add message: ${err.message}`);
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
}

/**
 * Get chat history for a user
 * @param {number} userId - Telegram user ID
 * @returns {Promise<array>}
 */
function getChatHistory(userId) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT role, content, created_at FROM chat_messages 
       WHERE user_id = ? 
       ORDER BY created_at ASC`,
      [userId],
      (err, rows) => {
        if (err) {
          logger.error(`Failed to get chat history: ${err.message}`);
          reject(err);
        } else {
          resolve(rows || []);
        }
      }
    );
  });
}

/**
 * Clear chat history for a user (reset session)
 * @param {number} userId - Telegram user ID
 * @returns {Promise<void>}
 */
function clearChatHistory(userId) {
  return new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM chat_messages WHERE user_id = ?`,
      [userId],
      function (err) {
        if (err) {
          logger.error(`Failed to clear chat history: ${err.message}`);
          reject(err);
        } else {
          logger.info(`Chat history cleared for user ${userId}`);
          resolve();
        }
      }
    );
  });
}

/**
 * Close database connection
 */
function closeDatabase() {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          logger.error(`Failed to close database: ${err.message}`);
          reject(err);
        } else {
          logger.info("Database connection closed");
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
}

module.exports = {
  initializeDatabase,
  getOrCreateSession,
  addMessage,
  getChatHistory,
  clearChatHistory,
  closeDatabase
};
