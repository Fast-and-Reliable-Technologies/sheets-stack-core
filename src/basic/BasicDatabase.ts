import { SheetDetails, SheetName, SpreadsheetId } from "../models";

export type SheetHeaders = string[];

export type DynamicObject = {
  [key: string]: any;
};

export type DynamicRow = DynamicObject & {
  _row: number;
};

export type BasicDbMeta = {
  spreadsheetId: string;
  title: string;
  sheets: SheetDetails[];
  spreadsheetUrl: string;
  tab: string;
  headers: string[];
};

export type BasicDbAppendResult = {
  updatedRows: number;
  data: object[];
};

export type ListOptions = {
  /** Default `25` */
  limit?: number;
  /** Default `0` */
  offset?: number;
};

export type BasicDatabaseSearchOptions = ListOptions & {
  /** https://lodash.com/docs/4.17.15#sortBy */
  sort?: string | string[];
  sortDesc?: boolean;
  /** https://lodash.com/docs/4.17.15#filter */
  filter?: DynamicObject;
  /** https://www.npmjs.com/package/lodash-query#query-api */
  query?: DynamicObject;
};

export interface BasicDatabase {
  getHeaders(sid: SpreadsheetId, name: SheetName): Promise<SheetHeaders>;

  getMeta(sid: SpreadsheetId, name: SheetName): Promise<BasicDbMeta>;

  getById(
    sid: SpreadsheetId,
    name: SheetName,
    _row: number
  ): Promise<DynamicRow>;

  list(
    sid: SpreadsheetId,
    name: SheetName,
    options?: ListOptions
  ): Promise<DynamicRow[]>;

  search(
    sid: SpreadsheetId,
    name: SheetName,
    options?: BasicDatabaseSearchOptions
  ): Promise<DynamicRow[]>;

  insert(
    sid: SpreadsheetId,
    name: SheetName,
    data: DynamicObject | DynamicObject[]
  ): Promise<BasicDbAppendResult>;

  update(
    sid: SpreadsheetId,
    name: SheetName,
    _row: number,
    item: DynamicObject
  ): Promise<boolean>;
}
