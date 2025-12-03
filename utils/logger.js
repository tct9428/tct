/* global process */
import pino from 'pino';
import path from 'path';
import fs from 'fs';
import os from 'os';

let _initializedConfig = null;
let _logger = null;
let _fileStreams = [];
let _isProd = false;

// ANSI color helpers - NO WHITE!
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  brightBlack: '\x1b[90m',
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightCyan: '\x1b[96m',
  bgRed: '\x1b[41m'
};

// Level configuration - each level has its own color for entire message
const LEVEL_CONFIG = {
  trace: { 
    priority: 10, 
    color: COLORS.brightBlack, 
    icon: '🔎', 
    label: 'TRACE',
    consoleMethod: 'log'
  },
  debug: { 
    priority: 20, 
    color: COLORS.cyan, 
    icon: '🐛', 
    label: 'DEBUG',
    consoleMethod: 'log'
  },
  info: { 
    priority: 30, 
    color: COLORS.green, 
    icon: 'ℹ️', 
    label: 'INFO',
    consoleMethod: 'log'
  },
  warn: { 
    priority: 40, 
    color: COLORS.yellow, 
    icon: '⚠️', 
    label: 'WARN',
    consoleMethod: 'warn'
  },
  error: { 
    priority: 50, 
    color: COLORS.red, 
    icon: '❌', 
    label: 'ERROR',
    consoleMethod: 'error'
  },
  fatal: { 
    priority: 60, 
    color: COLORS.brightRed, 
    icon: '💥', 
    label: 'FATAL',
    consoleMethod: 'error'
  }
};

/**
 * Parse log level string
 */
function parseLogLevel(logLevelStr) {
  if (!logLevelStr) return { main: 'info', extras: [] };
  
  const levels = logLevelStr.toLowerCase().split(',').map(l => l.trim());
  let mainLevel = 'info';
  const extras = [];
  
  for (const level of levels) {
    if (LEVEL_CONFIG[level]) {
      if (LEVEL_CONFIG[level].priority > LEVEL_CONFIG[mainLevel].priority) {
        mainLevel = level;
      }
    }
    if (level === 'trace' || level === 'debug') {
      if (!extras.includes(level)) {
        extras.push(level);
      }
    }
  }
  
  return { 
    main: mainLevel, 
    extras,
    mainPriority: LEVEL_CONFIG[mainLevel].priority 
  };
}

/**
 * Check if a level should be logged
 */
function shouldLog(level, logLevelConfig) {
  if (!logLevelConfig) return true;
  
  const levelPriority = LEVEL_CONFIG[level].priority;
  const { mainPriority, extras } = logLevelConfig;
  
  return levelPriority >= mainPriority || extras.includes(level);
}

/**
 * Create simple file stream
 */
function createLogStream(logDir, filename, maxSize = 10 * 1024 * 1024, maxFiles = 5) {
  const basePath = path.join(logDir, filename);
  
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  if (!fs.existsSync(basePath)) {
    fs.writeFileSync(basePath, '', 'utf8');
  }
  
  return fs.createWriteStream(basePath, { 
    flags: 'a', 
    encoding: 'utf8' 
  });
}

/**
 * Format timestamp like: "2025-12-03 00:07:13.544 +0300"
 */
function formatTimestamp(date) {
  const pad = (num, size = 2) => num.toString().padStart(size, '0');
  
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  const milliseconds = pad(date.getMilliseconds(), 3);
  
  // Get timezone offset
  const timezoneOffset = -date.getTimezoneOffset();
  const offsetHours = pad(Math.floor(Math.abs(timezoneOffset) / 60));
  const offsetMinutes = pad(Math.abs(timezoneOffset) % 60);
  const offsetSign = timezoneOffset >= 0 ? '+' : '-';
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds} ${offsetSign}${offsetHours}${offsetMinutes}`;
}

/**
 * Format entire log line with color - NO WHITE TEXT!
 */
function formatLogLine(level, message, data = {}) {
  const style = LEVEL_CONFIG[level] || LEVEL_CONFIG.info;
  const timestamp = formatTimestamp(new Date());
  const pid = process.pid;
  
  // Start building the line with timestamp in gray
  let line = `${COLORS.brightBlack}[${timestamp}]${COLORS.reset} `;
  
  // Add level label in its color
  line += `${style.color}${style.label}`;
  
  // Add PID in same color (no separate blue color)
  line += ` (${pid}):`;
  
  // Add icon and message in same color
  let finalMessage = message || '';
  if (finalMessage && !finalMessage.includes(style.icon)) {
    finalMessage = `${style.icon} ${finalMessage}`;
  }
  
  line += ` ${finalMessage}${COLORS.reset}`;
  
  return line;
}

/**
 * Create a pre-initialization fallback logger
 */
function createPreInitLogger() {
  const methods = {};
  
  for (const [level, config] of Object.entries(LEVEL_CONFIG)) {
    methods[level] = (obj, msg) => {
      const message = msg || (typeof obj === 'string' ? obj : '');
      const line = formatLogLine(level, message, obj);
      console[config.consoleMethod](line);
    };
  }
  
  methods.child = () => methods;
  return methods;
}

// Create pre-initialization logger instance
const _preInitLogger = createPreInitLogger();

/**
 * Initialize the logger
 */
export async function initLogger(config) {
  try {
    _initializedConfig = { ...config };
    _isProd = _initializedConfig.NODE_ENV === 'production';
    
    // Defaults
    const defaults = {
      LOG_DIR: 'logs',
      DEV_LOG_FILENAME: 'dev.log',
      PROD_LOG_FILENAME: 'prod.log',
      LOG_LEVEL: _isProd ? 'error' : 'info',
      LOG_ROTATION_SIZE: 10 * 1024 * 1024,
      LOG_ROTATION_FILES: 5
    };
    
    Object.assign(_initializedConfig, defaults, config);
    
    // Parse log level
    const logLevelConfig = parseLogLevel(_initializedConfig.LOG_LEVEL);
    
    // Create log directory
    const LOG_DIR = path.resolve(process.cwd(), _initializedConfig.LOG_DIR);
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
    
    // Prepare streams
    const streams = [];
    
    // Console stream
    const consoleStream = {
      write: (log) => {
        try {
          const parsed = JSON.parse(log);
          const level = parsed.level.toLowerCase();
          
          if (_isProd) {
            if (!['error', 'fatal', 'warn'].includes(level)) return;
          } else {
            if (!shouldLog(level, logLevelConfig)) return;
          }
          
          const style = LEVEL_CONFIG[level] || LEVEL_CONFIG.info;
          const timestamp = formatTimestamp(new Date(parsed.time || new Date()));
          const pid = parsed.pid || process.pid;
          
          // Build colored line
          let line = `${COLORS.brightBlack}[${timestamp}]${COLORS.reset} `;
          line += `${style.color}${style.label} (${pid}):`;
          
          // Add message with icon
          let message = parsed.msg || '';
          if (message && !message.includes(style.icon)) {
            message = `${style.icon} ${message}`;
          }
          line += ` ${message}${COLORS.reset}`;
          
          console[style.consoleMethod](line);
        } catch (err) {
          // Fallback for non-JSON logs
          console.log(log);
        }
      }
    };
    
    streams.push({ stream: consoleStream, level: 'trace' });
    
    // File stream - log everything
    const logFilename = _isProd ? 
      _initializedConfig.PROD_LOG_FILENAME : 
      _initializedConfig.DEV_LOG_FILENAME;
    
    const fileStream = createLogStream(
      LOG_DIR,
      logFilename,
      _initializedConfig.LOG_ROTATION_SIZE,
      _initializedConfig.LOG_ROTATION_FILES
    );
    
    _fileStreams.push(fileStream);
    
    const fileWriteStream = {
      write: (log) => {
        try {
          fileStream.write(log + '\n');
        } catch (err) {
          console.error('Failed to write to log file:', err.message);
        }
      }
    };
    
    streams.push({ 
      stream: fileWriteStream, 
      level: 'trace' 
    });
    
    // Create the logger
    _logger = pino({
      level: 'trace',
      base: { pid: process.pid, hostname: os.hostname() },
      timestamp: () => `,"time":"${new Date().toISOString()}"`,
      formatters: {
        level: (label) => ({ level: label }),
        bindings: () => ({})
      },
      serializers: {
        err: pino.stdSerializers.err,
        error: pino.stdSerializers.err
      },
      redact: _isProd ? {
        paths: ['password', 'token', 'secret', 'authorization', 'cookie'],
        censor: '[REDACTED]'
      } : undefined
    }, pino.multistream(streams));
    
    // Display clean initialization message
    console.log(`\n${COLORS.cyan}=== Logger Initialized ===${COLORS.reset}`);
    console.log(`${COLORS.cyan}Environment:${COLORS.reset} ${_isProd ? COLORS.red + 'PRODUCTION' : COLORS.green + 'DEVELOPMENT'}${COLORS.reset}`);
    
    const consoleLevel = _isProd ? 'ERROR, WARN, FATAL' : 
      `${logLevelConfig.main.toUpperCase()}${logLevelConfig.extras.length > 0 ? ' + ' + logLevelConfig.extras.join(',').toUpperCase() : ''}`;
    
    console.log(`${COLORS.cyan}Console Level:${COLORS.reset} ${COLORS.yellow}${consoleLevel}${COLORS.reset}`);
    console.log(`${COLORS.cyan}Log Directory:${COLORS.reset} ${COLORS.brightBlack}${LOG_DIR}${COLORS.reset}`);
    console.log(`${COLORS.cyan}==========================${COLORS.reset}\n`);
    
    // Test log
    if (!_isProd) {
      _logger.info({}, 'Development logger ready');
    } else {
      _logger.warn({}, 'Production logger ready - showing only errors, warns, and fatals');
    }
    
  } catch (error) {
    console.error(`${COLORS.bgRed}${COLORS.brightYellow} LOGGER INIT ERROR ${COLORS.reset} ${COLORS.red}${error.message}${COLORS.reset}`);
    _logger = _preInitLogger;
  }
}

/**
 * Get logger instance
 */
function getLogger() {
  return _logger || _preInitLogger;
}

/**
 * Create child logger
 */
export function createChildLogger(context) {
  const logger = getLogger();
  if (logger.child && typeof logger.child === 'function') {
    return logger.child(context);
  }
  return logger;
}

/**
 * Create log methods with filtering
 */
function createLogMethod(level) {
  return (obj, msg) => {
    const logger = getLogger();
    
    // Apply filtering
    if (_isProd && !['error', 'fatal', 'warn'].includes(level)) {
      return;
    }
    
    if (_initializedConfig && !_isProd) {
      const logLevelConfig = parseLogLevel(_initializedConfig.LOG_LEVEL);
      if (!shouldLog(level, logLevelConfig)) {
        return;
      }
    }
    
    // Format and log
    const message = msg || (typeof obj === 'string' ? obj : '');
    
    if (obj instanceof Error) {
      logger[level]({ err: obj }, message || obj.message);
    } else if (typeof obj === 'object' && obj !== null) {
      logger[level](obj, message || '');
    } else {
      logger[level]({}, message);
    }
  };
}

// Export logging methods
export const trace = createLogMethod('trace');
export const debug = createLogMethod('debug');
export const info = createLogMethod('info');
export const warn = createLogMethod('warn');
export const error = createLogMethod('error');
export const fatal = createLogMethod('fatal');

/**
 * Graceful shutdown handler to prevent duplicate error logs
 */
let _isShuttingDown = false;

export function setupGracefulShutdown(onShutdown) {
  // Handle SIGINT (Ctrl+C)
  process.on('SIGINT', async () => {
    if (_isShuttingDown) return;
    _isShuttingDown = true;
    
    info('Received SIGINT. Starting graceful shutdown...');
    
    try {
      if (onShutdown) {
        await onShutdown();
      }
      
      // Cleanup
      cleanup();
      info('Goodbye!');
      process.exit(0);
    } catch (err) {
      error(err, 'Error during shutdown');
      process.exit(1);
    }
  });
  
  // Handle uncaught exceptions - log once and shutdown
  process.on('uncaughtException', (err) => {
    if (_isShuttingDown) return;
    _isShuttingDown = true;
    
    error(err, 'Uncaught Exception');
    
    // Give time for log to write
    setTimeout(() => {
      cleanup();
      process.exit(1);
    }, 1000);
  });
  
  // Handle unhandled rejections
  process.on('unhandledRejection', (reason, promise) => {
    error(reason, 'Unhandled Promise Rejection');
  });
}

/**
 * HTTP logging middleware
 */
export function httpLogger() {
  return (req, res, next) => {
    if (_isProd) return next();
    
    const start = Date.now();
    const childLogger = createChildLogger({
      reqId: Math.random().toString(36).substring(2, 10),
      method: req.method,
      url: req.url
    });
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      const level = res.statusCode >= 500 ? 'error' :
                    res.statusCode >= 400 ? 'warn' : 'info';
      
      childLogger[level]({
        status: res.statusCode,
        duration: `${duration}ms`
      }, `${req.method} ${req.url}`);
    });
    
    next();
  };
}

/**
 * Cleanup
 */
export function cleanup() {
  _fileStreams.forEach(stream => {
    try {
      if (stream && !stream.destroyed) {
        stream.end();
      }
    } catch (err) {
      // Ignore cleanup errors
    }
  });
  _fileStreams = [];
}

/**
 * Emergency log
 */
export function emergencyLog(level, message, data = {}) {
  const style = LEVEL_CONFIG[level] || LEVEL_CONFIG.error;
  const line = formatLogLine(level, message, data);
  console[style.consoleMethod](line);
}

// Export main logger object
export const logger = {
  trace,
  debug,
  info,
  warn,
  error,
  fatal,
  child: createChildLogger,
  http: httpLogger,
  emergency: emergencyLog,
  setupGracefulShutdown
};

// Auto cleanup on exit
if (typeof process !== 'undefined') {
  process.once('beforeExit', cleanup);
}
