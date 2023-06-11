import _ from "lodash";
import NodeCache from "node-cache";
import { DefaultSpreadsheetsClient, SpreadsheetsClient } from "../sheet";
import { SheetName, SpreadsheetId } from "../models";
import {
  ListDatabase,
  ListHeaders,
  ListsDbItems,
  ListsDbMeta,
} from "./ListDatabase";

// TODO: refactor caching strategy
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
export class DefaultListDatabase implements ListDatabase {
  protected cli: SpreadsheetsClient;

  constructor(cli: SpreadsheetsClient) {
    this.cli = cli;
  }

  async getTitles(sid: SpreadsheetId, name: SheetName): Promise<ListHeaders> {
    const cacheKey = getTitleCacheKey(sid, name);
    let titles: string[];
    let cached: string[] | undefined = cache.get(cacheKey);
    if (!cached) {
      const range = `${name}!A1:Z1`;
      const res = await this.cli.getRange(sid, range);
      titles = res[0];
      cache.set(cacheKey, titles);
    } else {
      titles = cached;
    }
    return titles;
  }

  async getMeta(sid: SpreadsheetId, name: SheetName): Promise<ListsDbMeta> {
    const cacheKey = getMetaCacheKey(sid, name);
    let meta: ListsDbMeta;
    const cached: ListsDbMeta | undefined = cache.get(cacheKey);
    if (!cached) {
      const details = await this.cli.getDetails(sid);
      const titles = await this.getTitles(sid, name);
      meta = {
        ...details,
        tab: name,
        titles,
      };
      cache.set(cacheKey, meta);
    } else {
      meta = cached;
    }
    return meta;
  }

  async getAll(sid: SpreadsheetId, name: SheetName): Promise<ListsDbItems[]> {
    const titles = await this.getTitles(sid, name);
    const range = `${name}!A${2}:Z`;
    const res = await this.cli.getRange(sid, range, {
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

  private static _instance: ListDatabase;

  static async instance(
    keyFile?: string,
    scopes?: string
  ): Promise<ListDatabase> {
    if (!DefaultListDatabase._instance) {
      // Low Level Helper Client
      const cli = await DefaultSpreadsheetsClient.instance(keyFile, scopes);
      // High Level Helper Client To Parse Structured Sheets
      DefaultListDatabase._instance = new DefaultListDatabase(cli);
    }
    return DefaultListDatabase._instance;
  }
}
