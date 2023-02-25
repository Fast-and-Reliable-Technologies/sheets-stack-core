// @ts-check
const _ = require("lodash");
require("better-logging").default(console);

/**
 * @template T
 * @param {object} object
 * @param {string} path
 * @param {T} defaultValue
 * @returns {T}
 */
const safeGet = (object, path, defaultValue) => {
  const val = _.get(object, path, defaultValue);
  if (_.isNil(val)) {
    return defaultValue;
  }
  return val;
};

const DEBUG_LOG_LEVEL = 4;
const LOG_LOG_LEVEL = 3;
const INFO_LOG_LEVEL = 2;
const WARN_LOG_LEVEL = 1;
const ERROR_LOG_LEVEL = 0;
const OFF_LOG_LEVEL = 0;

/**
 * Abstraction for logger in multiple runtime environments
 * @class
 */
class SheetStackLogger {
  /**
   * @param {string} message
   */
  debug(message) {
    console.debug(message);
  }
  /**
   * @param {string} message
   */
  log(message) {
    console.log(message);
  }
  /**
   * @param {string} message
   */
  info(message) {
    console.info(message);
  }
  /**
   * @param {string} message
   */
  warn(message) {
    console.warn(message);
  }
  /**
   * @param {string} message
   */
  error(message) {
    console.error(message);
  }
}

/**
 * @class
 * @implements {SheetStackLogger}
 */
class ConsoleLogger extends SheetStackLogger {
  /**
   * Set the log level according to https://olian04.gitbook.io/better-logging/setup/log-levels
   * @param {number} newLevel
   */
  setLevel(newLevel) {
    console.logLevel = newLevel;
  }
  debug(message) {
    console.debug(message);
  }
  log(message) {
    console.log(message);
  }
  info(message) {
    console.info(message);
  }
  warn(message) {
    console.warn(message);
  }
  error(message) {
    console.error(message);
  }
}

const logger = new ConsoleLogger();

module.exports = {
  ConsoleLogger,
  logger,
  safeGet,
  SheetStackLogger,
  DEBUG_LOG_LEVEL,
  LOG_LOG_LEVEL,
  INFO_LOG_LEVEL,
  WARN_LOG_LEVEL,
  ERROR_LOG_LEVEL,
  OFF_LOG_LEVEL,
};
