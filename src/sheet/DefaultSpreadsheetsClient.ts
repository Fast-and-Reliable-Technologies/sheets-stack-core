require("dotenv").config();
import { SheetStackLogger, getDefaultLogger, safeGet } from "../utils";
import { google, sheets_v4 } from "googleapis";
import {
  JSONClient,
  GoogleAuth,
} from "google-auth-library/build/src/auth/googleauth";
import {
  CellRange,
  CellValues,
  SheetWriteResult,
  SpreadsheetDetails,
  SpreadsheetId,
} from "../models";
import {
  SpreadsheetReadOptions,
  SpreadsheetsClient,
} from "./SpreadsheetsClient";

// TODO: can pass in auth and sheets client to constructor?
const KEY_FILE = process.env.KEY_FILE ?? "keys.json";
const SCOPES =
  process.env.SCOPES ?? "https://www.googleapis.com/auth/spreadsheets";

// TODO: refactor caching strategy

function getAuth(
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
async function getSheetsClient(
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
export class DefaultSpreadsheetsClient implements SpreadsheetsClient {
  protected cli: sheets_v4.Sheets;
  protected logger: SheetStackLogger;

  constructor(cli: sheets_v4.Sheets, logger?: SheetStackLogger) {
    this.cli = cli;
    this.logger = logger ?? getDefaultLogger();
  }

  async getDetails(sid: SpreadsheetId): Promise<SpreadsheetDetails> {
    const cli = await this.cli;
    try {
      const { data } = await cli.spreadsheets.get({
        includeGridData: false,
        spreadsheetId: sid,
      });
      const title = data.properties?.title || "";
      const { sheets: sheetSheets = [], spreadsheetUrl } = data;
      return {
        spreadsheetId: sid,
        title,
        sheets: sheetSheets.map(({ properties }) => ({
          title: safeGet(properties, "title", ""),
        })),
        spreadsheetUrl: spreadsheetUrl || "",
      };
    } catch (cause: any) {
      const message = `Failed to read details of ${sid}`;
      this.logger.error(message + " && " + cause.message);
      throw cause;
    }
  }

  async getRange(
    sid: SpreadsheetId,
    range: CellRange,
    options?: SpreadsheetReadOptions
  ): Promise<CellValues> {
    const cli = await this.cli;
    try {
      const { data } = await cli.spreadsheets.values.get({
        spreadsheetId: sid,
        range,
        ...options,
      });
      return safeGet(data, "values", []);
    } catch (cause: any) {
      const message = `Failed to read values of ${sid} @ ${range}`;
      this.logger.error(message + " && " + cause.message);
      throw cause;
    }
  }

  async writeRange(
    sid: SpreadsheetId,
    range: CellRange,
    values: CellValues
  ): Promise<SheetWriteResult> {
    const cli = await this.cli;
    try {
      const { data } = await cli.spreadsheets.values.update({
        includeValuesInResponse: false,
        range,
        spreadsheetId: sid,
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
      const message = `Failed to read values of ${sid} @ ${range}`;
      this.logger.error(message + " && " + cause.message);
      throw cause;
    }
  }

  async appendRange(sid: SpreadsheetId, range: CellRange, values: CellValues) {
    const cli = await this.cli;
    try {
      const { data } = await cli.spreadsheets.values.append({
        includeValuesInResponse: false,
        range,
        spreadsheetId: sid,
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
      const message = `Failed to read values of ${sid} @ ${range}`;
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

  static async instance(
    keyFile?: string,
    scopes?: string
  ): Promise<SpreadsheetsClient> {
    if (!DefaultSpreadsheetsClient._instance) {
      const auth = getAuth(keyFile, scopes);
      // Google Sheets Client
      const sheetsCli = await getSheetsClient(auth);
      // Low Level Helper Client
      DefaultSpreadsheetsClient._instance = new DefaultSpreadsheetsClient(
        sheetsCli
      );
    }
    return DefaultSpreadsheetsClient._instance;
  }
}
