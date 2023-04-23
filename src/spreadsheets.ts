require("dotenv").config();
import { SheetStackLogger, getDefaultLogger, safeGet } from "./utils";
import { google, sheets_v4 } from "googleapis";
import {
  JSONClient,
  GoogleAuth,
} from "google-auth-library/build/src/auth/googleauth";
import { SheetWriteResult, SpreadsheetDetails } from "./Models";

const KEY_FILE = process.env.KEY_FILE ?? "keys.json";
const SCOPES =
  process.env.SCOPES ?? "https://www.googleapis.com/auth/spreadsheets";

// const cache = new NodeCache();

/** @typedef {import("google-auth-library/build/src/auth/googleauth").GoogleAuth} GoogleAuth */
/** @typedef {import("googleapis").sheets_v4.Sheets} Sheets */
/** @typedef {import("./utils").SheetStackLogger} SheetStackLogger */
/** @typedef {import("./Models").SpreadsheetDetails} SpreadsheetDetails */
/** @typedef {import("./Models").SheetDetails} SheetDetails */
/** @typedef {import("./Models").SheetAppendResult} SheetAppendResult */
/** @typedef {import("./Models").SheetWriteResult} SheetWriteResult */

export function getAuth(
  keyFile: string = KEY_FILE,
  scopes: string = SCOPES
): GoogleAuth<JSONClient> {
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
export async function getSheetsClient(
  auth: GoogleAuth<JSONClient>
): Promise<sheets_v4.Sheets> {
  const sheets = google.sheets({
    version: "v4",
    auth: await auth.getClient(),
  });
  return sheets;
}

/**
 * Example Usage:
```ts
import { SpreadsheetsClient } from "@de44/sheets-stack-core";

async function getRange(
        spreadsheetId: string,
        sheetName: string,
        range: string = "A1:Z1000"
): Promise<any[][]> {
        const cli = await SpreadsheetsClient.instance();
        const data = await db.read(spreadsheetId, sheetName, range);
        return data;
}
```
 */
export class SpreadsheetsClient {
  protected cli: sheets_v4.Sheets;
  protected logger: SheetStackLogger;

  constructor(cli: sheets_v4.Sheets, logger?: SheetStackLogger) {
    this.cli = cli;
    this.logger = logger ?? getDefaultLogger();
  }

  /**
   *
   * @param {string} spreadsheetId
   * @returns {Promise<SpreadsheetDetails>}
   * @throws
   */
  async sheetDetails(spreadsheetId: string): Promise<SpreadsheetDetails> {
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
    } catch (cause: any) {
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
  async read(
    spreadsheetId: string,
    range: string,
    options: any = {}
  ): Promise<any[][]> {
    const cli = await this.cli;
    try {
      const { data } = await cli.spreadsheets.values.get({
        spreadsheetId,
        range,
        ...options,
      });
      return safeGet(data, "values", []);
    } catch (cause: any) {
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
  async write(
    spreadsheetId: string,
    range: string,
    values: any[][]
  ): Promise<SheetWriteResult> {
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
    } catch (cause: any) {
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
  async append(spreadsheetId: string, range: string, values: any[][]) {
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
    } catch (cause: any) {
      const message = `Failed to read values of ${spreadsheetId} @ ${range}`;
      this.logger.error(message + " && " + cause.message);
      throw cause;
    }
  }

  /*
   * ===============
   *     STATIC
   * ===============
   */

  private static _instance: SpreadsheetsClient;

  static async instance(): Promise<SpreadsheetsClient> {
    if (!SpreadsheetsClient._instance) {
      // Google API Auth
      const auth = getAuth();
      // Google Sheets Client
      const sheetsCli = await getSheetsClient(auth);
      // Low Level Helper Client
      SpreadsheetsClient._instance = new SpreadsheetsClient(sheetsCli);
    }
    return this._instance;
  }
}
