// @ts-check
require("./Models");
const { BasicDatabase } = require("./basicDatabase");
const { ListsDatabase } = require("./listsDatabase");
const {
  getAuth,
  getSheetsClient,
  KEY_FILE,
  SCOPES,
  SpreadsheetsClient,
} = require("./spreadsheets");
const {
  DEBUG_LOG_LEVEL,
  ERROR_LOG_LEVEL,
  INFO_LOG_LEVEL,
  LOG_LOG_LEVEL,
  OFF_LOG_LEVEL,
  SheetStackLogger,
  WARN_LOG_LEVEL,
} = require("./utils");

exports = module.exports = {
  BasicDatabase,
  logging: {
    DEBUG_LOG_LEVEL,
    ERROR_LOG_LEVEL,
    INFO_LOG_LEVEL,
    LOG_LOG_LEVEL,
    OFF_LOG_LEVEL,
    SheetStackLogger,
    WARN_LOG_LEVEL,
  },
  sheets: {
    getAuth,
    getSheetsClient,
    KEY_FILE,
    SCOPES,
    SpreadsheetsClient,
  },
  ListsDatabase,
};
