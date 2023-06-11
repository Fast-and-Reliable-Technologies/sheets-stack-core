import {
  SheetAppendResult,
  CellRange,
  SheetWriteResult,
  SpreadsheetDetails,
  SpreadsheetId,
  CellValues,
} from "../models";

export type SpreadsheetReadOptions = {
  /** See details at: https://developers.google.com/sheets/api/reference/rest/v4/Dimension */
  majorDimension?: "ROWS" | "COLUMNS";
  /** See details at: https://developers.google.com/sheets/api/reference/rest/v4/ValueRenderOption */
  valueRenderOption?: "FORMATTED_VALUE" | "UNFORMATTED_VALUE" | "FORMULA";
  /** See details at: https://developers.google.com/sheets/api/reference/rest/v4/DateTimeRenderOption */
  dateTimeRenderOption?: "FORMATTED_STRING";
};

/**
 * This interface is meant to be used as a wrapper around the Google Sheets API.
```ts
const SHEET_ID: SpreadsheetId = "...";
const cli: SpreadsheetClient = await DefaultSpreadsheetsClient.instance();
const a1 = await cli.getRange(SHEET_ID, "sheet1!A1");
```
 */
export interface SpreadsheetsClient {
  getDetails(sid: SpreadsheetId): Promise<SpreadsheetDetails>;

  /**
   * Reads a range of cells from a spreadsheet.
   * @param {SpreadsheetId} sid The spreadsheet ID
   * @param {CellRange} range The range to read, e.g. `"sheetName!A1:Z1000"`
   * @param {SpreadsheetReadOptions} options Full docs at http://bit.ly/3k4G16i
   * @returns {Promise<CellValues>} The raw values of the cells in the range
   */
  getRange(
    sid: SpreadsheetId,
    range: CellRange,
    options?: SpreadsheetReadOptions
  ): Promise<CellValues>;

  /**
   * Writes a range of cells to a spreadsheet.
   * @param sid The spreadsheet ID
   * @param range The range to write, e.g. `"sheetName!A1:Z1000"`
   * @param values The raw values to write
   */
  writeRange(
    sid: SpreadsheetId,
    range: CellRange,
    values: CellValues
  ): Promise<SheetWriteResult>;

  /**
   * Appends a range of cells to a spreadsheet. Writes data to the next available row of the sheet.
   * 
   * *NOTE:* The data can be written OUTSIDE of the defined range.
   * 
```ts
const spreadsheetId = "...";
const range = "Sheet1!H1";
// also support multiple rows
const values = [[new Date().toISOString(), randomString(), randomString()]];
let data = await sheets.appendRange(spreadsheetId, range, values);
```
   * 
   * @param sid The spreadsheet ID
   * @param range The range to append, e.g. `"sheetName!A1:Z1000"`
   * @param values The raw values to append. Support single or multiple rows.
   */
  appendRange(
    sid: SpreadsheetId,
    range: CellRange,
    values: CellValues
  ): Promise<SheetAppendResult>;
}
