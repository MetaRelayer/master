// Logging utility for the relayer
const winston = require('winston');
const { getConfig } = require('./config');

function createLogger(context) {
  const config = getConfig();
  
  // Create a winston logger
  const logger = winston.createLogger({
    level: config.LOG_LEVEL,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.printf(info => {
        return `${info.timestamp} [${context}] ${info.level}: ${info.message}`;
      })
    ),
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ 
        filename: 'logs/error.log', 
        level: 'error' 
      }),
      new winston.transports.File({ 
        filename: 'logs/combined.log' 
      })
    ]
  });
  
  return logger;
}

module.exports = { createLogger };