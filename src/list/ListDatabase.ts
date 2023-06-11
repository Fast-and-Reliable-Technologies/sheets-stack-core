import { SheetDetails, SheetName, SpreadsheetId } from "../models";

export type ListHeaders = string[];

export type ListsDbMeta = {
  spreadsheetId: string;
  title: string;
  sheets: SheetDetails[];
  spreadsheetUrl: string;
  tab: string;
  titles: string[];
};

export type ListsDbItems = {
  title: string;
  items: string[];
};

export interface ListDatabase {
  getTitles(sid: SpreadsheetId, name: SheetName): Promise<ListHeaders>;

  getMeta(sid: SpreadsheetId, name: SheetName): Promise<ListsDbMeta>;

  getAll(sid: SpreadsheetId, name: SheetName): Promise<ListsDbItems[]>;
}
