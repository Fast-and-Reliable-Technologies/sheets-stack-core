import _ from "lodash";
// @ts-ignore - No @types for lodash-query
import lodashQuery from "lodash-query";
import NodeCache from "node-cache";
import { safeGet } from "../utils";
import { CellValues, SheetName, SpreadsheetId } from "../models";
import { DefaultSpreadsheetsClient, SpreadsheetsClient } from "../sheet";
import {
  BasicDatabase,
  BasicDatabaseSearchOptions,
  BasicDbAppendResult,
  BasicDbMeta,
  DynamicObject,
  DynamicRow,
  ListOptions,
  SheetHeaders,
} from "./BasicDatabase";

// @ts-ignore - No @types for lodash-query
lodashQuery(_);

// TODO: refactor caching strategy
const cache = new NodeCache({
  maxKeys: 1000,
  stdTTL: 45,
});

const IS_NUMBER_PATTERN = /^-?[0-9]+(?:.[0-9]+)?$/;
const IS_BOOLEAN_PATTERN = /^(?:true|false)$/i;
const IS_TRUE_PATTERN = /true/i;

const mapRows = (
  headers: SheetHeaders,
  rows: CellValues,
  offset: number
): DynamicRow[] =>
  rows.map((row, i) => {
    const item: DynamicRow = { _row: i + offset + 2 };
    for (let i = 0; i < headers.length; i++) {
      let val: any = row[i];
      if (IS_NUMBER_PATTERN.test(row[i])) {
        val = Number(row[i]);
      } else if (IS_BOOLEAN_PATTERN.test(row[i])) {
        val = IS_TRUE_PATTERN.test(row[i]);
      }
      _.set(item, headers[i], val);
    }
    return item;
  });

const mapValues = (
  headers: SheetHeaders,
  data: DynamicObject[]
): CellValues => {
  let values: CellValues = [];
  for (let i = 0; i < data.length; i++) {
    const row: string[] = [];
    for (let j = 0; j < headers.length; j++) {
      row.push(safeGet(data[i], headers[j], ""));
    }
    values.push(row);
  }
  return values;
};

const toHeaderRange = (sheetName: string): string => `${sheetName}!A1:Z1`;
const toHeaderCacheKey = (spreadsheetId: string, sheetName: string): string =>
  `${spreadsheetId}:${sheetName}:H`;
const toMetaCacheKey = (spreadsheetId: string, sheetName: string): string =>
  `${spreadsheetId}:${sheetName}:M`;

/**
   * Example Usage:
```ts
import { BasicDatabase } from "@de44/sheets-stack-core";

async function getData(
        spreadsheetId: string,
        sheetName: string
): Promise<any[]> {
        const db = await BasicDatabase.instance();
        const options = { limit: 2, offset: 1 };
        const data = await db.list(spreadsheetId, sheetName, options);
        return data;
}
```
   */
export class DefaultBasicDatabase implements BasicDatabase {
  protected cli: SpreadsheetsClient;

  constructor(cli: SpreadsheetsClient) {
    this.cli = cli;
  }

  async getHeaders(sid: SpreadsheetId, name: SheetName): Promise<SheetHeaders> {
    const cacheKey = toHeaderCacheKey(sid, name);
    let headers: string[];
    let cached: string[] | undefined = cache.get(cacheKey);
    if (!cached) {
      const res = await this.cli.getRange(sid, toHeaderRange(name));
      headers = (res as string[][])[0];
      cache.set(cacheKey, headers);
    } else {
      headers = cached;
    }
    return headers;
  }

  async getMeta(sid: SpreadsheetId, name: SheetName): Promise<BasicDbMeta> {
    const cacheKey = toMetaCacheKey(sid, name);
    let meta: BasicDbMeta;
    const cached: BasicDbMeta | undefined = cache.get(cacheKey);
    if (!cached) {
      const details = await this.cli.getDetails(sid);
      const headers = await this.getHeaders(sid, name);
      meta = {
        ...details,
        tab: name,
        headers,
      };
      cache.set(cacheKey, meta);
    } else {
      meta = cached;
    }
    return meta;
  }

  async getById(
    sid: SpreadsheetId,
    name: SheetName,
    _row: number
  ): Promise<DynamicRow> {
    const headers = await this.getHeaders(sid, name);
    const range = `${name}!A${_row}:Z${_row}`;
    const rows = await this.cli.getRange(sid, range);
    const data = mapRows(headers, rows, _row - 2);
    return data[0] || { _row: -99 };
  }

  async list(
    sid: SpreadsheetId,
    name: SheetName,
    options: ListOptions = {}
  ): Promise<DynamicRow[]> {
    const { limit = 10, offset = 0 } = options;
    const headers = await this.getHeaders(sid, name);
    const range = `${name}!A${2 + offset}:Z${2 + offset + limit - 1}`;
    const rows = await this.cli.getRange(sid, range);
    const data = mapRows(headers, rows, offset);
    return data;
  }

  async search(
    sid: SpreadsheetId,
    name: SheetName,
    options: BasicDatabaseSearchOptions = {}
  ): Promise<DynamicRow[]> {
    const {
      limit = 25,
      offset = 0,
      sort,
      sortDesc = false,
      filter,
      query,
    } = options;
    const headers = await this.getHeaders(sid, name);
    const range = `${name}!A2:Z1000`;
    const rows = await this.cli.getRange(sid, range);
    let data: DynamicRow[] = mapRows(headers, rows, offset);
    if (_.isArray(sort) || _.isString(sort)) {
      data = _.sortBy(data, sort) as DynamicRow[];
    }
    if (sortDesc) {
      data = data.reverse();
    }
    if (_.isPlainObject(filter)) {
      data = _.filter(data, filter) as DynamicRow[];
    }
    if (_.isPlainObject(query)) {
      // @ts-ignore - No @types for lodash-query
      data = _.query(data, query);
    }
    if (_.isNumber(offset) && offset > 0) {
      data = _.drop(data, offset);
    }
    if (_.isNumber(limit) && limit > 0) {
      data = _.take(data, limit);
    }
    return data;
  }

  async insert(
    sid: SpreadsheetId,
    name: SheetName,
    data: DynamicObject | DynamicObject[]
  ): Promise<BasicDbAppendResult> {
    const insertData = _.isArray(data) ? data : [data];
    const headers = await this.getHeaders(sid, name);
    const values = mapValues(headers, insertData);
    const res = await this.cli.appendRange(sid, `${name}!A1`, values);
    const m = /!A([0-9]+):/.exec(res.updatedRange);
    let newData: DynamicObject[] = [];
    if (m) {
      const offset = Number(m[1] ?? "-1");
      if (offset > 0) {
        newData = mapRows(headers, values, offset);
      }
    }
    return {
      updatedRows: res.updatedRows,
      data: newData,
    };
  }

  async update(
    sid: SpreadsheetId,
    name: SheetName,
    _row: number,
    item: DynamicObject
  ): Promise<boolean> {
    const headers = await this.getHeaders(sid, name);
    const values = mapValues(headers, [item]);
    const res = await this.cli.writeRange(sid, `${name}!A${_row}`, values);
    return res.updatedRows === 1;
  }

  /*
   * ===============
   *     STATIC
   * ===============
   */

  private static _instance: BasicDatabase;

  static async instance(
    keyFile?: string,
    scopes?: string
  ): Promise<BasicDatabase> {
    if (!DefaultBasicDatabase._instance) {
      // Low Level Helper Client
      const cli = await DefaultSpreadsheetsClient.instance(keyFile, scopes);
      // High Level Helper Client To Parse Structured Sheets
      DefaultBasicDatabase._instance = new DefaultBasicDatabase(cli);
    }
    return this._instance;
  }
}
