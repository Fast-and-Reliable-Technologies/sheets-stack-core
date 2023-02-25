// @ts-check
const { logger } = require("./utils");
const {
  getAuth,
  getSheetsClient,
  SpreadsheetsClient,
} = require("./spreadsheets");
const { BasicDatabase } = require("./basicDatabase");

/** @typedef {import('./Models').SearchOptions} SearchOptions */

const spreadsheetId = "1tPc2W9ZXRY7dy4q5UQYUv4TZ0GGSkdxs29FMlJGZy10";
const sheetName = "basicdb";

const randomNumber = (min = -1000, max = 1000) =>
  Math.trunc(Math.random() * (max - min) + min);
const randomUser = () => {
  const id = randomNumber();
  return {
    id,
    name: `user${id}`,
    email: `user${id}@example.com`,
    isAdmin: Math.random() < 0.5,
  };
};

const USER1 = {
  _row: 2,
  id: 1,
  name: "user1",
  email: "user1@example.com",
  isAdmin: true,
};
const USER2 = {
  _row: 3,
  id: 2,
  name: "user2",
  email: "user2@example.com",
  isAdmin: false,
};
const USER3 = {
  _row: 4,
  id: 3,
  name: "user3",
  email: "user3@example.com",
  isAdmin: false,
};
const USER4 = {
  _row: 5,
  id: 4,
  name: "user4",
  email: "user4@example.com",
  isAdmin: false,
};

async function getDb() {
  const auth = getAuth();
  const sheetsCli = await getSheetsClient(auth);
  const cli = new SpreadsheetsClient(sheetsCli, logger);
  return new BasicDatabase(cli);
}

describe("Basic Database", () => {
  test("can fetch headers", async () => {
    const db = await getDb();
    const actual = await db.getHeaders(spreadsheetId, sheetName);
    const expected = ["id", "name", "email", "isAdmin"];
    expect(actual).toEqual(expected);
  });
  test("can fetch meta", async () => {
    const db = await getDb();
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
      tab: "basicdb",
      headers: ["id", "name", "email", "isAdmin"],
    };
    expect(actual).toEqual(expected);
  });
  test("can get row", async () => {
    const db = await getDb();
    const _row = 3;
    const actual = await db.get(spreadsheetId, sheetName, _row);
    const expected = { ...USER2, _row };
    expect(actual).toEqual(expected);
  });
  test("can list records", async () => {
    const db = await getDb();
    const actual = await db.list(spreadsheetId, sheetName);
    const expected = [USER1, USER2, USER3, USER4];
    expect(actual).toEqual(expected);
  });
  test("can list records with limit", async () => {
    const db = await getDb();
    const options = { limit: 2 };
    const actual = await db.list(spreadsheetId, sheetName, options);
    const expected = [USER1, USER2];
    expect(actual).toEqual(expected);
  });
  test("can list records with limit and offset", async () => {
    const db = await getDb();
    const options = { limit: 2, offset: 1 };
    const actual = await db.list(spreadsheetId, sheetName, options);
    const expected = [USER2, USER3];
    expect(actual).toEqual(expected);
  });
  test("can search records", async () => {
    const db = await getDb();
    const actual = await db.search(spreadsheetId, sheetName);
    const expected = [USER1, USER2, USER3, USER4];
    expect(actual).toEqual(expected);
  });
  test("can search records with filter", async () => {
    const db = await getDb();
    /** @type {SearchOptions} */
    const options = { filter: { id: 2 } };
    const actual = await db.search(spreadsheetId, sheetName, options);
    const expected = [USER2];
    expect(actual).toEqual(expected);
  });
  test("can search records with single sort", async () => {
    const db = await getDb();
    /** @type {SearchOptions} */
    const options = { sort: "id", sortDesc: true };
    const actual = await db.search(spreadsheetId, sheetName, options);
    const expected = [USER4, USER3, USER2, USER1];
    expect(actual).toEqual(expected);
  });
  test("can search records with custom sort", async () => {
    const db = await getDb();
    /** @type {SearchOptions} */
    const options = { sort: ["isAdmin", "name"], sortDesc: true };
    const actual = await db.search(spreadsheetId, sheetName, options);
    const expected = [USER1, USER4, USER3, USER2];
    expect(actual).toEqual(expected);
  });
  test("can search records with query", async () => {
    const db = await getDb();
    /** @type {SearchOptions} */
    const options = { query: { id: { $gt: 1, $lte: 3 } } };
    const actual = await db.search(spreadsheetId, sheetName, options);
    const expected = [USER2, USER3];
    expect(actual).toEqual(expected);
  });
  test("can append single row", async () => {
    const db = await getDb();
    const data = randomUser();
    const actual = await db.insert(spreadsheetId, "writedb", data);
    const expected = {
      updatedRows: 1,
      data: [
        {
          _row: actual.data[0]._row,
          ...data,
        },
      ],
    };
    expect(actual).toEqual(expected);
  });
  test("can append multiple rows", async () => {
    const db = await getDb();
    const data = [randomUser(), randomUser()];
    const actual = await db.insert(spreadsheetId, "writedb", data);
    const expected = {
      updatedRows: 2,
      data: [],
    };
    for (let i = 0; i < data.length; i++) {
      // @ts-ignore
      expected.data.push({
        _row: actual.data[i]._row,
        ...data[i],
      });
    }
    expect(actual).toEqual(expected);
  });
  test("can update row", async () => {
    const db = await getDb();
    const data = randomUser();
    const _row = 3;
    data.name = "updated-" + data.name;
    const actual = await db.update(spreadsheetId, "writedb", _row, data);
    const expected = true;
    expect(actual).toEqual(expected);
    const res = await db.list(spreadsheetId, "writedb", {
      limit: 1,
      offset: 1,
    });
    data._row = _row;
    expect(res).toEqual([data]);
  });
});
