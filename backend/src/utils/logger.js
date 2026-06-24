const winston = require('winston');
const config = require('../config/config');

class Logger {
  constructor(moduleName = 'App') {
    const transports = [
      new winston.transports.Console({
        silent: config.nodeEnv === 'test',
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
            let log = `${timestamp} [${moduleName}] ${level}: ${message}`;

            if (Object.keys(meta).length > 0) {
              log += ` ${JSON.stringify(meta)}`;
            }

            if (stack) {
              log += `
${stack}`;
            }

            return log;
          })
        ),
      }),
    ];

    if (config.nodeEnv !== 'test') {
      transports.push(
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
        })
      );
    }

    this.logger = winston.createLogger({
      level: config.nodeEnv === 'production' ? 'info' : 'debug',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
          let log = `${timestamp} [${moduleName}] ${level.toUpperCase()}: ${message}`;

          if (Object.keys(meta).length > 0) {
            log += ` ${JSON.stringify(meta)}`;
          }

          if (stack) {
            log += `
${stack}`;
          }

          return log;
        })
      ),
      transports,
    });
  }

  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  error(message, meta = {}) {
    this.logger.error(message, meta);
  }

  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }
}

module.exports = Logger;
