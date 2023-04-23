import _ from "lodash";
import NodeCache from "node-cache";
import { SpreadsheetsClient } from "./spreadsheets";
import { ListsDbItems, ListsDbMeta } from "./Models";

const cache = new NodeCache({
  maxKeys: 1000,
  stdTTL: 45,
});

const mapRows = (titles: string[], res: string[][]): ListsDbItems[] =>
  // TODO validate dimensions and handle edge cases
  res.map((items, i) => ({ title: titles[i], items }));

const getTitleCacheKey = (spreadsheetId: string, sheetName: string): string =>
  `${spreadsheetId}:${sheetName}:T`;
const getMetaCacheKey = (spreadsheetId: string, sheetName: string): string =>
  `${spreadsheetId}:${sheetName}:M`;

/**
   * Example Usage:
```ts
import { ListsDatabase } from "@de44/sheets-stack-core";

async function getLists(
        spreadsheetId: string,
        sheetName: string
): Promise<ListsDbItems[]> {
        const db = await ListsDatabase.instance();
        const data = await db.list(spreadsheetId, sheetName, options);
        return data;
}
```
   */
export class ListsDatabase {
  protected cli: SpreadsheetsClient;

  constructor(cli: SpreadsheetsClient) {
    this.cli = cli;
  }

  async getTitles(spreadsheetId: string, sheetName: string): Promise<string[]> {
    const cacheKey = getTitleCacheKey(spreadsheetId, sheetName);
    let titles: string[];
    let cached: string[] | undefined = cache.get(cacheKey);
    if (!cached) {
      const range = `${sheetName}!A1:Z1`;
      const res = await this.cli.read(spreadsheetId, range);
      titles = res[0];
      cache.set(cacheKey, titles);
    } else {
      titles = cached;
    }
    return titles;
  }

  async getMeta(
    spreadsheetId: string,
    sheetName: string
  ): Promise<ListsDbMeta> {
    const cacheKey = getMetaCacheKey(spreadsheetId, sheetName);
    let meta: ListsDbMeta;
    const cached: ListsDbMeta | undefined = cache.get(cacheKey);
    if (!cached) {
      const details = await this.cli.sheetDetails(spreadsheetId);
      const titles = await this.getTitles(spreadsheetId, sheetName);
      meta = {
        ...details,
        tab: sheetName,
        titles,
      };
      cache.set(cacheKey, meta);
    } else {
      meta = cached;
    }
    return meta;
  }
  /**
   * @param {string} spreadsheetId
   * @param {string} sheetName
   * @returns {Promise<ListsDbItems[]>}
   */
  async list(
    spreadsheetId: string,
    sheetName: string
  ): Promise<ListsDbItems[]> {
    const titles = await this.getTitles(spreadsheetId, sheetName);
    const range = `${sheetName}!A${2}:Z`;
    const res = await this.cli.read(spreadsheetId, range, {
      majorDimension: "COLUMNS",
    });
    const data = mapRows(titles, res);
    return data;
  }

  /*
   * ===============
   *     STATIC
   * ===============
   */

  private static _instance: ListsDatabase;

  static async instance(): Promise<ListsDatabase> {
    if (!ListsDatabase._instance) {
      // Low Level Helper Client
      const cli = await SpreadsheetsClient.instance();
      // High Level Helper Client To Parse Structured Sheets
      ListsDatabase._instance = new ListsDatabase(cli);
    }
    return this._instance;
  }
}
