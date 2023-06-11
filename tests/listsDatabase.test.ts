import {
  DefaultListDatabase,
  ListDatabase,
  SheetName,
  SpreadsheetId,
} from "../src";

const LISTS_DATA_RAW = require("./lists-data.raw.json");

const spreadsheetId: SpreadsheetId =
  "1tPc2W9ZXRY7dy4q5UQYUv4TZ0GGSkdxs29FMlJGZy10";
const sheetName: SheetName = "listsdb";

describe("List Database", () => {
  const dbP: Promise<ListDatabase> = DefaultListDatabase.instance();
  test("can fetch titles", async () => {
    const db: ListDatabase = await dbP;
    const actual = await db.getTitles(spreadsheetId, sheetName);
    const expected = ["Colors", "Industries", "Foods"];
    expect(actual).toEqual(expected);
  });
  test("can fetch meta", async () => {
    const db: ListDatabase = await dbP;
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
    const db: ListDatabase = await dbP;
    const actual = await db.getAll(spreadsheetId, sheetName);
    const expected = LISTS_DATA_RAW;
    expect(actual).toEqual(expected);
  });
});
