const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize, errors, json } = format;

const isDev = process.env.NODE_ENV !== 'production';

// Human-readable format for development
const INLINE_KEYS = new Set(['method', 'url', 'statusCode', 'durationMs', 'role', 'ip']);

const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'HH:mm:ss.SSS' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, requestId, userId, stack, service, ...meta }) => {
    let line = `${timestamp} [${level}]`;
    if (requestId) line += ` [${String(requestId).slice(0, 8)}]`;
    if (userId)    line += ` [u:${userId}]`;
    line += ` ${message}`;

    const inline = [];
    const rest   = {};
    for (const [k, v] of Object.entries(meta)) {
      if (v == null) continue;
      if (INLINE_KEYS.has(k)) inline.push(`${k}=${v}`);
      else rest[k] = v;
    }

    if (inline.length)           line += `  ${inline.join('  ')}`;
    if (Object.keys(rest).length) line += `\n    ${JSON.stringify(rest, null, 2).replace(/\n/g, '\n    ')}`;
    if (stack)                    line += `\n${stack}`;
    return line;
  })
);

// Structured JSON for production (ELK / Datadog / CloudWatch ready)
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

const logger = createLogger({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  format: isDev ? devFormat : prodFormat,
  defaultMeta: { service: 'realtydoor-api' },
  transports: [
    new transports.Console(),
    ...(isDev ? [] : [
      new transports.File({ filename: 'logs/error.log', level: 'error', maxsize: 10_485_760, maxFiles: 5 }),
      new transports.File({ filename: 'logs/combined.log', maxsize: 10_485_760, maxFiles: 10 }),
    ]),
  ],
  exceptionHandlers: [new transports.Console()],
  rejectionHandlers: [new transports.Console()],
});

module.exports = logger;
