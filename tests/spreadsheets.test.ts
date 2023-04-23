// @ts-check
import {
  SheetStackLogger,
  getAuth,
  getSheetsClient,
  SpreadsheetsClient,
} from "../src";
const SHEET_DATA_RAW = require("./sheet-data.raw.json");

const spreadsheetId = "1tPc2W9ZXRY7dy4q5UQYUv4TZ0GGSkdxs29FMlJGZy10";
const logger = new SheetStackLogger();

const randomNumber = (min = -1000, max = 1000) =>
  Math.trunc(Math.random() * (max - min) + min);
const randomString = () => randomNumber() + "";

describe("getAuth", () => {
  test("getAuth not null for defaults", () => {
    const auth = getAuth();
    expect(auth).not.toBeNull();
  });
  test("getAuth gets client with valid creds", async () => {
    const auth = getAuth();
    const client = await auth.getClient();
    expect(client).not.toBeNull();
  });
});

describe("getSheetsClient", () => {
  test("getSheetsClient not null for defaults", async () => {
    const auth = getAuth();
    const cli = await getSheetsClient(auth);
    expect(cli).not.toBeNull();
  });
  test("getSheetsClient gets client with valid creds", async () => {
    const auth = getAuth();
    const cli = await getSheetsClient(auth);
    const { data } = await cli.spreadsheets.get({
      includeGridData: false,
      spreadsheetId,
    });
    const actual = {
      properties: {
        title: data.properties?.title,
      },
      sheets: data.sheets,
      spreadsheetId: data.spreadsheetId,
    };
    const expected = SHEET_DATA_RAW;
    expect(actual).toEqual(expected);
  });
});

describe("SpreadsheetsClient", () => {
  test("client gets sheets details for test sheet", async () => {
    const sheets = await SpreadsheetsClient.instance();
    const actual = await sheets.sheetDetails(spreadsheetId);
    const expected = {
      title: "[DO NOT DELETE] Development Test Sheet",
      sheets: [
        { title: "Sheet1" },
        { title: "basicdb" },
        { title: "listsdb" },
        { title: "writedb" },
      ],
      spreadsheetId: "1tPc2W9ZXRY7dy4q5UQYUv4TZ0GGSkdxs29FMlJGZy10",
      spreadsheetUrl:
        "https://docs.google.com/spreadsheets/d/1tPc2W9ZXRY7dy4q5UQYUv4TZ0GGSkdxs29FMlJGZy10/edit",
    };
    expect(actual).toEqual(expected);
  });
  test("client reads single cell", async () => {
    const sheets = await SpreadsheetsClient.instance();
    const actual = await sheets.read(spreadsheetId, "Sheet1!A1");
    const expected = [["Hello"]];
    expect(actual).toEqual(expected);
  });
  test("client reads multi cell", async () => {
    const sheets = await SpreadsheetsClient.instance();
    const actual = await sheets.read(spreadsheetId, "Sheet1!A1:B1");
    const expected = [["Hello", "World!"]];
    expect(actual).toEqual(expected);
  });
  test("client reads multi cell column oriented", async () => {
    const sheets = await SpreadsheetsClient.instance();
    const options = { majorDimension: "COLUMNS" };
    const actual = await sheets.read(spreadsheetId, "Sheet1!A1:B1", options);
    const expected = [["Hello"], ["World!"]];
    expect(actual).toEqual(expected);
  });
  test("client reads sparse cell", async () => {
    const sheets = await SpreadsheetsClient.instance();
    const actual = await sheets.read(spreadsheetId, "Sheet1!A1:B6");
    const expected = [
      ["Hello", "World!"],
      ["This"],
      ["is"],
      ["only"],
      ["a"],
      ["", "test!"],
    ];
    expect(actual).toEqual(expected);
  });
  test("client reads whole sheet", async () => {
    const sheets = await SpreadsheetsClient.instance();
    const actual = await sheets.read(spreadsheetId, "basicdb!A2:Z1000");
    const expected = [
      ["1", "user1", "user1@example.com", "TRUE"],
      ["2", "user2", "user2@example.com", "FALSE"],
      ["3", "user3", "user3@example.com", "FALSE"],
      ["4", "user4", "user4@example.com", "FALSE"],
    ];
    expect(actual).toEqual(expected);
  });
  test("client writes single cell", async () => {
    const sheets = await SpreadsheetsClient.instance();
    const range = "Sheet1!D1";
    let values = [[randomString()]];
    // WRITE RANDOM VALUE
    let data = await sheets.write(spreadsheetId, range, values);
    expect(data).toEqual({
      updatedRows: 1,
      updatedColumns: 1,
      updatedCells: 1,
    });
    // READ WRITTEN VALUE
    const actual = await sheets.read(spreadsheetId, range);
    const expected = values;
    expect(actual).toEqual(expected);
  });
  test("client writes multi cell", async () => {
    const sheets = await SpreadsheetsClient.instance();
    const range = "Sheet1!E1:F3";
    const values = [];
    for (let i = 0; i < 3; i++) {
      const curr = [];
      for (let k = 0; k < 2; k++) {
        curr.push(randomString());
      }
      values.push(curr);
    }
    // WRITE RANDOM VALUE
    let data = await sheets.write(spreadsheetId, range, values);
    expect(data).toEqual({
      updatedRows: 3,
      updatedColumns: 2,
      updatedCells: 6,
    });
    // READ WRITTEN VALUE
    const actual = await sheets.read(spreadsheetId, range);
    const expected = values;
    expect(actual).toEqual(expected);
  });
  test("client appends multi cells", async () => {
    const sheets = await SpreadsheetsClient.instance();
    const range = "Sheet1!H1";
    const values = [[new Date().toISOString(), randomString(), randomString()]];
    // WRITE RANDOM VALUE
    let data = await sheets.append(spreadsheetId, range, values);
    expect(data).toEqual({
      updatedRange: data.updatedRange,
      updatedRows: 1,
      updatedColumns: 3,
      updatedCells: 3,
    });
    // READ WRITTEN VALUE
    const actual = await sheets.read(spreadsheetId, data.updatedRange);
    const expected = values;
    expect(actual).toEqual(expected);
  });
  test("client appends multi rows", async () => {
    const sheets = await SpreadsheetsClient.instance();
    const range = "Sheet1!H1";
    const now = new Date().toISOString();
    const values = [
      [now, randomString(), randomString()],
      [now, randomString(), randomString()],
    ];
    // WRITE RANDOM VALUE
    let data = await sheets.append(spreadsheetId, range, values);
    expect(data).toEqual({
      updatedRange: data.updatedRange,
      updatedRows: 2,
      updatedColumns: 3,
      updatedCells: 6,
    });
    // READ WRITTEN VALUE
    const actual = await sheets.read(spreadsheetId, data.updatedRange);
    const expected = values;
    expect(actual).toEqual(expected);
  });
});
