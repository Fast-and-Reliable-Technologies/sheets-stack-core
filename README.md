# Sheets Stack - CORE

JS wrapper to simplify interactions with Google Sheets. It provides three
modules for different use cases.

See the full [Documentation on GitHub Pages](https://fast-and-reliable-technologies.github.io/sheets-stack-core/).

## Getting Started

Start with documentation for `BasicDatabase`, `ListsDatabase`, and `SpreadsheetsClient`.

```ts
import {
  BasicDatabase,
  ListsDatabase,
  SpreadsheetsClient,
} from "@de44/sheets-stack-core";

async function getData(
  spreadsheetId: string,
  sheetName: string
): Promise<any[]> {
  const db = await BasicDatabase.instance();
  const options = { limit: 2, offset: 1 };
  const data = await db.list(spreadsheetId, sheetName, options);
  return data;
}

async function getLists(
  spreadsheetId: string,
  sheetName: string
): Promise<ListsDbItems[]> {
  const db = await ListsDatabase.instance();
  const data = await db.list(spreadsheetId, sheetName, options);
  return data;
}

async function getRange(
  spreadsheetId: string,
  sheetName: string,
  range: string = "A1:Z1000"
): Promise<any[][]> {
  const cli = await SpreadsheetsClient.instance();
  const data = await db.read(spreadsheetId, sheetName, range);
  return data;
}
```

## Modes

### RPC - Remote Procedural Call

This module allows you to interact with sheets at a `cell` level.

### Lists DB

This module treats each column in a spreadsheet as a list. The first row is
the list title and each subsequent cell is an entry.

#### Use Cases

- Flash cards
- Sight words

### Basic DB

This module treats each column as a DB column with the first row being the
header. Each subsequent row represents a database entry. While this module
provides advanced pagination, sorting, and querying it runs in memory and
is therefore more scalable for smaller datasets.

## Usage

This library is available on NPM under [@de44/sheets-stack-core](https://www.npmjs.com/package/@de44/sheets-stack-core).

// TODO: describe environment variables, logging, and credentials
