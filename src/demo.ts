import {
  DefaultBasicDatabase,
  DefaultListDatabase,
  DefaultSpreadsheetsClient,
  ListDatabase,
  ListsDbItems,
  SpreadsheetsClient,
} from ".";
// } from "@de44/sheets-stack-core";

async function getObjects(
  spreadsheetId: string,
  sheetName: string
): Promise<any[]> {
  const db = await DefaultBasicDatabase.instance();
  const options = { limit: 10, offset: 20 };
  const data = await db.list(spreadsheetId, sheetName, options);
  return data;
}

async function getLists(
  spreadsheetId: string,
  sheetName: string
): Promise<ListsDbItems[]> {
  const db: ListDatabase = await DefaultListDatabase.instance();
  const data = await db.getAll(spreadsheetId, sheetName);
  return data;
}

async function getRange(
  spreadsheetId: string,
  sheetName: string,
  range: string = "A1:Z1000"
): Promise<any[][]> {
  const cli: SpreadsheetsClient = await DefaultSpreadsheetsClient.instance();
  const sheetRange = `${sheetName}!${range}`;
  const data = await cli.getRange(spreadsheetId, sheetRange);
  return data;
}
