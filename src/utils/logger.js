const fs = require('fs');
const path = require('path');
const { createLogger, format, transports, addColors } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

const { combine, timestamp, printf, colorize, uncolorize, errors, splat, metadata } = format;

const LOG_DIR = path.join(__dirname, '..', '..', 'logs');
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const env = process.env.NODE_ENV || 'development';
const LEVEL = process.env.LOG_LEVEL || (env === 'production' ? 'info' : 'debug');

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  verbose: 'cyan',
  debug: 'blue',
  silly: 'grey'
};

addColors(colors);

// Safe JSON stringify that handles circular references
function safeStringify(obj, space) {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    return value;
  }, space);
}

const consoleFormat = printf(({ level, message, timestamp: ts, stack, metadata: meta = {} }) => {
  const base = `${ts} [${level}] ${stack || message}`;
  const metaKeys = Object.keys(meta).filter((key) => key !== 'stack');
  if (!metaKeys.length) {
    return base;
  }
  const metaPayload = metaKeys.reduce((acc, key) => {
    acc[key] = meta[key];
    return acc;
  }, {});
  return `${base} ${safeStringify(metaPayload)}`;
});

const fileFormat = printf(({ level, message, timestamp: ts, stack, metadata: meta = {} }) => {
  const baseMessage = stack || message || meta.message || '';
  const payload = {
    timestamp: ts,
    level,
    message: baseMessage
  };

  const metaPayload = { ...meta };
  delete metaPayload.stack;
  delete metaPayload.message;

  if (Object.keys(metaPayload).length) {
    payload.metadata = metaPayload;
  }

  return `${safeStringify(payload)}`;
});

const enumerateErrorFormat = format((info) => {
  if (info instanceof Error) {
    return {
      ...info,
      message: info.message,
      stack: info.stack,
      metadata: { ...(info.metadata || {}), stack: info.stack }
    };
  }
  return info;
});

const logger = createLogger({
  level: LEVEL,
  levels,
  format: combine(
    enumerateErrorFormat(),
    metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
    timestamp({
      format: () => {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
      }
    }),
    errors({ stack: true }),
    splat()
  ),
  transports: [
    new transports.Console({
      level: process.env.CONSOLE_LOG_LEVEL || (env === 'production' ? 'info' : 'debug'),
      format: combine(colorize({ all: true }), consoleFormat)
    })
  ],
  exitOnError: false
});

if (env !== 'test') {
  logger.add(new DailyRotateFile({
    dirname: LOG_DIR,
    filename: 'error-%DATE%.log',
    datePattern: 'DD-MM-YYYY',
    level: 'error',
    maxSize: '10m',
    format: combine(uncolorize(), fileFormat)
  }));

  logger.add(new DailyRotateFile({
    dirname: LOG_DIR,
    filename: 'combined-%DATE%.log',
    datePattern: 'DD-MM-YYYY',
    maxSize: '10m',
    format: combine(uncolorize(), fileFormat)
  }));
}

logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

function getErrorDetails(error) {
  if (!error) return { message: 'Unknown error', stack: null };
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack };
  }
  if (typeof error === 'object') {
    return { message: error.message || JSON.stringify(error), stack: error.stack || null };
  }
  return { message: String(error), stack: null };
}

process.on('unhandledRejection', (reason) => {
  const details = getErrorDetails(reason);
  logger.error('Unhandled promise rejection', details);
});

process.on('uncaughtException', (error) => {
  const details = getErrorDetails(error);
  logger.error('Uncaught exception', details);
});

module.exports = logger;
