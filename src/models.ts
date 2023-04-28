export interface SpreadsheetDetails {
  spreadsheetId: string;
  title: string;
  sheets: SheetDetails[];
  spreadsheetUrl: string;
}

export interface SheetDetails {
  title: string;
}

export interface SheetWriteResult {
  updatedRows: number;
  updatedColumns: number;
  updatedCells: number;
}

export interface SheetAppendResult {
  updatedRange: string;
  updatedRows: number;
  updatedColumns: number;
  updatedCells: number;
}

export interface BasicDbMeta {
  spreadsheetId: string;
  title: string;
  sheets: SheetDetails[];
  spreadsheetUrl: string;
  tab: string;
  headers: string[];
}

export interface BasicDbAppendResult {
  updatedRows: number;
  data: object[];
}

export interface ListsDbMeta {
  spreadsheetId: string;
  title: string;
  sheets: SheetDetails[];
  spreadsheetUrl: string;
  tab: string;
  titles: string[];
}

export interface ListsDbItems {
  title: string;
  items: string[];
}

export interface PaginationOptions {
  options: {
    /** Default `25` */
    limit: number;
    /** Default `0` */
    offset: number;
  };
}

export interface SearchOptions {
  /** Default `25` */
  limit?: number;
  /** Default `0` */
  offset?: number;
  /** https://lodash.com/docs/4.17.15#sortBy */
  sort?: string | string[];
  sortDesc?: boolean;
  /** https://lodash.com/docs/4.17.15#filter */
  filter?: any;
  /** https://www.npmjs.com/package/lodash-query#query-api */
  query?: any;
}
