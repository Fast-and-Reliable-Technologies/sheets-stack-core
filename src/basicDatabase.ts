import _ from "lodash";
// @ts-ignore - No @types for lodash-query
import lodashQuery from "lodash-query";
import NodeCache from "node-cache";
import { safeGet } from "./utils";
import { SpreadsheetsClient } from "./spreadsheets";
import { BasicDbAppendResult, BasicDbMeta } from "./Models";

// @ts-ignore - No @types for lodash-query
lodashQuery(_);

const cache = new NodeCache({
  maxKeys: 1000,
  stdTTL: 45,
});

const IS_NUMBER_PATTERN = /^-?[0-9]+(?:.[0-9]+)?$/;
const IS_BOOLEAN_PATTERN = /^(?:true|false)$/i;
const IS_TRUE_PATTERN = /true/i;

const mapRows = (headers: string[], rows: string[][], offset: number): any[] =>
  rows.map((row, i) => {
    const item: any = { _row: i + offset + 2 };
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

const mapValues = (headers: string[], data: any | any[]): string[][] => {
  let values;
  const mapRow = (item: string) =>
    headers.map((name) => safeGet(item, name, ""));
  if (_.isArray(data)) {
    values = data.map(mapRow);
  } else {
    values = [mapRow(data)];
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
export class BasicDatabase {
  protected cli: SpreadsheetsClient;

  constructor(cli: SpreadsheetsClient) {
    this.cli = cli;
  }

  async getHeaders(
    spreadsheetId: string,
    sheetName: string
  ): Promise<string[]> {
    const cacheKey = toHeaderCacheKey(spreadsheetId, sheetName);
    let headers: string[];
    let cached: string[] | undefined = cache.get(cacheKey);
    if (!cached) {
      const res = await this.cli.read(spreadsheetId, toHeaderRange(sheetName));
      headers = res[0];
      cache.set(cacheKey, headers);
    } else {
      headers = cached;
    }
    return headers;
  }

  async getMeta(
    spreadsheetId: string,
    sheetName: string
  ): Promise<BasicDbMeta> {
    const cacheKey = toMetaCacheKey(spreadsheetId, sheetName);
    let meta: BasicDbMeta;
    const cached: BasicDbMeta | undefined = cache.get(cacheKey);
    if (!cached) {
      const details = await this.cli.sheetDetails(spreadsheetId);
      const headers = await this.getHeaders(spreadsheetId, sheetName);
      meta = {
        ...details,
        tab: sheetName,
        headers,
      };
      cache.set(cacheKey, meta);
    } else {
      meta = cached;
    }
    return meta;
  }

  async get(
    spreadsheetId: string,
    sheetName: string,
    _row: number
  ): Promise<any> {
    const headers = await this.getHeaders(spreadsheetId, sheetName);
    const range = `${sheetName}!A${_row}:Z${_row}`;
    const rows = await this.cli.read(spreadsheetId, range);
    const data = mapRows(headers, rows, _row - 2);
    return data[0] || {};
  }

  async list(
    spreadsheetId: string,
    sheetName: string,
    options: any = {}
  ): Promise<any[]> {
    const { limit = 10, offset = 0 } = options;
    const headers = await this.getHeaders(spreadsheetId, sheetName);
    const range = `${sheetName}!A${2 + offset}:Z${2 + offset + limit - 1}`;
    const rows = await this.cli.read(spreadsheetId, range);
    const data = mapRows(headers, rows, offset);
    return data;
  }

  async search(
    spreadsheetId: string,
    sheetName: string,
    options: any = {}
  ): Promise<any[]> {
    const {
      limit = 25,
      offset = 0,
      sort,
      sortDesc = false,
      filter,
      query,
    } = options;
    const headers = await this.getHeaders(spreadsheetId, sheetName);
    const range = `${sheetName}!A2:Z1000`;
    const rows = await this.cli.read(spreadsheetId, range);
    let data = mapRows(headers, rows, offset);
    if (_.isArray(sort) || _.isString(sort)) {
      data = _.sortBy(data, sort);
    }
    if (sortDesc) {
      data = data.reverse();
    }
    if (_.isPlainObject(filter)) {
      data = _.filter(data, filter);
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
    spreadsheetId: string,
    sheetName: string,
    data: any | any[]
  ): Promise<BasicDbAppendResult> {
    const headers = await this.getHeaders(spreadsheetId, sheetName);
    const values = mapValues(headers, data);
    const res = await this.cli.append(spreadsheetId, `${sheetName}!A1`, values);
    const m = /!A([0-9]+):/.exec(res.updatedRange);
    let newData = [];
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
    spreadsheetId: string,
    sheetName: string,
    _row: number,
    item: any
  ): Promise<boolean> {
    const headers = await this.getHeaders(spreadsheetId, sheetName);
    const values = mapValues(headers, item);
    const res = await this.cli.write(
      spreadsheetId,
      `${sheetName}!A${_row}`,
      values
    );
    return res.updatedRows === 1;
  }

  /*
   * ===============
   *     STATIC
   * ===============
   */

  private static _instance: BasicDatabase;

  static async instance(): Promise<BasicDatabase> {
    if (!BasicDatabase._instance) {
      // Low Level Helper Client
      const cli = await SpreadsheetsClient.instance();
      // High Level Helper Client To Parse Structured Sheets
      BasicDatabase._instance = new BasicDatabase(cli);
    }
    return this._instance;
  }
}
