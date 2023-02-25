// @ts-check
const { logger } = require("./utils");
const {
  getAuth,
  getSheetsClient,
  SpreadsheetsClient,
} = require("./spreadsheets");
const { ListsDatabase } = require("./listsDatabase");
const LISTS_DATA_RAW = require("./lists-data.raw.json");

const spreadsheetId = "1tPc2W9ZXRY7dy4q5UQYUv4TZ0GGSkdxs29FMlJGZy10";
const sheetName = "listsdb";

async function getDb() {
  const auth = getAuth();
  const sheetsCli = await getSheetsClient(auth);
  const cli = new SpreadsheetsClient(sheetsCli, logger);
  return new ListsDatabase(cli);
}

describe("List Database", () => {
  const dbP = getDb();
  test("can fetch titles", async () => {
    const db = await dbP;
    const actual = await db.getTitles(spreadsheetId, sheetName);
    const expected = ["Colors", "Industries", "Foods"];
    expect(actual).toEqual(expected);
  });
  test("can fetch meta", async () => {
    const db = await dbP;
    const actual = await db.getMeta(spreadsheetId, sheetName);
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
      tab: "listsdb",
      titles: ["Colors", "Industries", "Foods"],
    };
    expect(actual).toEqual(expected);
  });
  test("can fetch all lists", async () => {
    const db = await dbP;
    const actual = await db.list(spreadsheetId, sheetName);
    const expected = LISTS_DATA_RAW;
    expect(actual).toEqual(expected);
  });
});
