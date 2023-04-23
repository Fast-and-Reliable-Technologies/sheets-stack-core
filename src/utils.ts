import _ from "lodash";
import betterLogging from "better-logging";

export const safeGet = <T>(object: any, path: string, defaultValue: T): T => {
  const val = _.get(object, path, defaultValue);
  if (_.isNil(val)) {
    return defaultValue;
  }
  return val;
};

export const DEBUG_LOG_LEVEL = 4;
export const LOG_LOG_LEVEL = 3;
export const INFO_LOG_LEVEL = 2;
export const WARN_LOG_LEVEL = 1;
export const ERROR_LOG_LEVEL = 0;
export const OFF_LOG_LEVEL = 0;

export class SheetStackLogger {
  protected sink: Console;

  constructor(sink = console) {
    this.sink = sink;
    // TODO: only initialize if needed
    betterLogging(sink);
  }
  debug(message: string) {
    this.sink.debug(message);
  }
  log(message: string) {
    this.sink.log(message);
  }
  info(message: string) {
    this.sink.info(message);
  }
  warn(message: string) {
    this.sink.warn(message);
  }
  error(message: string) {
    this.sink.error(message);
  }
}

export class ConsoleLogger extends SheetStackLogger {
  constructor(logLevel: number = DEBUG_LOG_LEVEL) {
    super();
    this.setLevel(logLevel);
  }
  /**
   * Set the log level according to https://olian04.gitbook.io/better-logging/setup/log-levels.
   * See exports matching `*_LOG_LEVEL`.
   * @param {number} newLevel
   */
  setLevel(newLevel: number) {
    _.set(super.sink, "logLevel", newLevel);
  }
}

let logger: ConsoleLogger | undefined;
export const getDefaultLogger = () => {
  if (!logger) {
    logger = new ConsoleLogger();
  }
  return logger;
};
