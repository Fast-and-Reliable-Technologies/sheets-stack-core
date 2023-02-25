// @ts-check
const _ = require("lodash");
require("lodash-query")(_);
const NodeCache = require("node-cache");

/** @typedef {import('./Models').ListsDbMeta} ListsDbMeta */
/** @typedef {import('./spreadsheets').SpreadsheetsClient} SpreadsheetsClient */

const cache = new NodeCache({
  maxKeys: 1000,
  stdTTL: 45,
});

const mapRows = (titles, res) =>
  // TODO validate dimensions and handle edge cases
  res.map((items, i) => ({ title: titles[i], items }));

const getTitleCacheKey = (spreadsheetId, sheetName) =>
  `${spreadsheetId}:${sheetName}:T`;
const getMetaCacheKey = (spreadsheetId, sheetName) =>
  `${spreadsheetId}:${sheetName}:M`;

class ListsDatabase {
  /**
   *
   * @param {SpreadsheetsClient} cli
   */
  constructor(cli) {
    /**
     * @private
     * @type {SpreadsheetsClient}
     */
    this.cli = cli;
  }

  /**
   * @param {string} spreadsheetId
   * @param {string} sheetName
   * @returns {Promise<string[]>}
   */
  async getTitles(spreadsheetId, sheetName) {
    const cacheKey = getTitleCacheKey(spreadsheetId, sheetName);
    let titles = cache.get(cacheKey);
    if (!titles) {
      const range = `${sheetName}!A1:Z1`;
      const res = await this.cli.read(spreadsheetId, range);
      titles = res[0];
      cache.set(cacheKey, titles);
    }
    return titles;
  }
  /**
   * @param {string} spreadsheetId
   * @param {string} sheetName
   * @returns {Promise<ListsDbMeta>}
   */
  async getMeta(spreadsheetId, sheetName) {
    const cacheKey = getMetaCacheKey(spreadsheetId, sheetName);
    let meta = cache.get(cacheKey);
    if (!meta) {
      const details = await this.cli.sheetDetails(spreadsheetId);
      const titles = await this.getTitles(spreadsheetId, sheetName);
      meta = {
        ...details,
        tab: sheetName,
        titles,
      };
      cache.set(cacheKey, meta);
    }
    return meta;
  }
  /**
   * @param {string} spreadsheetId
   * @param {string} sheetName
   * @returns {Promise<string[][]>}
   */
  async list(spreadsheetId, sheetName) {
    const titles = await this.getTitles(spreadsheetId, sheetName);
    const range = `${sheetName}!A${2}:Z`;
    const res = await this.cli.read(spreadsheetId, range, {
      majorDimension: "COLUMNS",
    });
    const data = mapRows(titles, res);
    return data;
  }
}

module.exports = { ListsDatabase };

// const listDb = new ListsDatabase(
//   "1Y4rJf4kq2DGMvaO9XmSyA5asMWLBd6j-KOuYHDPMO5A",
//   "lists"
// );

// listDb.list().then((data) => console.log(data));
