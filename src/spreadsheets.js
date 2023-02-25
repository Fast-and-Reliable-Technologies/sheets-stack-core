// @ts-check
require("dotenv").config();
const { logger: DEFAULT_LOGGER, safeGet } = require("./utils");
const { google } = require("googleapis");

const KEY_FILE = process.env.KEY_FILE || "keys.json";
const SCOPES =
  process.env.SCOPES || "https://www.googleapis.com/auth/spreadsheets";

// const cache = new NodeCache();

/** @typedef {import("google-auth-library/build/src/auth/googleauth").GoogleAuth} GoogleAuth */
/** @typedef {import("googleapis").sheets_v4.Sheets} Sheets */
/** @typedef {import("./utils").SheetStackLogger} SheetStackLogger */
/** @typedef {import("./Models").SpreadsheetDetails} SpreadsheetDetails */
/** @typedef {import("./Models").SheetDetails} SheetDetails */
/** @typedef {import("./Models").SheetAppendResult} SheetAppendResult */
/** @typedef {import("./Models").SheetWriteResult} SheetWriteResult */

/**
 *
 * @param {string} keyFile
 * @param {string} scopes
 * @returns {GoogleAuth}
 */
function getAuth(keyFile = KEY_FILE, scopes = SCOPES) {
  const auth = new google.auth.GoogleAuth({
    keyFile,
    scopes,
  });
  return auth;
}

/**
 *
 * @param {GoogleAuth} auth Return value from `getAuth`
 * @returns {Promise<Sheets>}
 */
async function getSheetsClient(auth) {
  const sheets = google.sheets({
    version: "v4",
    auth: await auth.getClient(),
  });
  return sheets;
}

/**
 * @class
 */
class SpreadsheetsClient {
  /**
   *
   * @param {Sheets} cli
   * @param {SheetStackLogger} logger
   */
  constructor(cli, logger = DEFAULT_LOGGER) {
    /**
     * @type {Sheets}
     * @private
     */
    this.cli = cli;
    /**
     * @private
     * @type {SheetStackLogger}
     */
    this.logger = logger;
  }

  /**
   *
   * @param {string} spreadsheetId
   * @returns {Promise<SpreadsheetDetails>}
   * @throws
   */
  async sheetDetails(spreadsheetId) {
    const cli = await this.cli;
    try {
      const { data } = await cli.spreadsheets.get({
        includeGridData: false,
        spreadsheetId,
      });
      const title = data.properties?.title || "";
      const { sheets: sheetSheets = [], spreadsheetUrl } = data;
      return {
        spreadsheetId,
        title,
        sheets: sheetSheets.map(({ properties }) => ({
          title: safeGet(properties, "title", ""),
        })),
        spreadsheetUrl: spreadsheetUrl || "",
      };
    } catch (cause) {
      const message = `Failed to read details of ${spreadsheetId}`;
      this.logger.error(message + " && " + cause.message);
      throw cause;
    }
  }

  /**
   * See full docs at http://bit.ly/3k4G16i
   * @param {string} spreadsheetId
   * @param {string} range
   * @param {object} options Full docs at http://bit.ly/3k4G16i
   * @param {object} options Full docs at http://bit.ly/3k4G16i
   * @returns {Promise<any[][]>}
   */
  async read(spreadsheetId, range, options = {}) {
    const cli = await this.cli;
    try {
      const { data } = await cli.spreadsheets.values.get({
        spreadsheetId,
        range,
        ...options,
      });
      return safeGet(data, "values", []);
    } catch (cause) {
      const message = `Failed to read values of ${spreadsheetId} @ ${range}`;
      this.logger.error(message + " && " + cause.message);
      throw cause;
    }
  }

  /**
   *
   * @param {string} spreadsheetId
   * @param {string} range
   * @param {any[][]} values
   * @returns {Promise<SheetWriteResult>}
   */
  async write(spreadsheetId, range, values) {
    const cli = await this.cli;
    try {
      const { data } = await cli.spreadsheets.values.update({
        includeValuesInResponse: false,
        range,
        spreadsheetId,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values,
        },
      });
      return {
        updatedRows: safeGet(data, "updatedRows", -1),
        updatedColumns: safeGet(data, "updatedColumns", -1),
        updatedCells: safeGet(data, "updatedCells", -1),
      };
    } catch (cause) {
      const message = `Failed to read values of ${spreadsheetId} @ ${range}`;
      this.logger.error(message + " && " + cause.message);
      throw cause;
    }
  }

  /**
   *
   * @param {string} spreadsheetId
   * @param {string} range
   * @param {any[][]} values
   * @returns {Promise<SheetAppendResult>}
   */
  async append(spreadsheetId, range, values) {
    const cli = await this.cli;
    try {
      const { data } = await cli.spreadsheets.values.append({
        includeValuesInResponse: false,
        range,
        spreadsheetId,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values,
        },
      });
      return {
        updatedRange: safeGet(data, "updates.updatedRange", ""),
        updatedRows: safeGet(data, "updates.updatedRows", -1),
        updatedColumns: safeGet(data, "updates.updatedColumns", -1),
        updatedCells: safeGet(data, "updates.updatedCells", -1),
      };
    } catch (cause) {
      const message = `Failed to read values of ${spreadsheetId} @ ${range}`;
      this.logger.error(message + " && " + cause.message);
      throw cause;
    }
  }
}

module.exports = {
  getAuth,
  getSheetsClient,
  KEY_FILE,
  SCOPES,
  SpreadsheetsClient,
};
