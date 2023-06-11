export type SpreadsheetId = string;
export type SheetName = string;
export type CellRange = string;
export type CellValues = string[][];

export type SheetDetails = {
  title: string;
};

export type SpreadsheetDetails = {
  spreadsheetId: string;
  title: string;
  sheets: SheetDetails[];
  spreadsheetUrl: string;
};

export type SheetWriteResult = {
  updatedRows: number;
  updatedColumns: number;
  updatedCells: number;
};

export type SheetAppendResult = {
  updatedRange: string;
  updatedRows: number;
  updatedColumns: number;
  updatedCells: number;
};
