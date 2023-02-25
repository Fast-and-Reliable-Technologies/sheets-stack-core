// @ts-check
const _ = require("lodash");
require("lodash-query")(_);
const NodeCache = require("node-cache");
const { logger: DEFAULT_LOGGER, safeGet } = require("./utils");

/** @typedef {import('./Models').BasicDbAppendResult} BasicDbAppendResult */
/** @typedef {import('./Models').BasicDbMeta} BasicDbMeta */
/** @typedef {import('./Models').PaginationOptions} PaginationOptions */
/** @typedef {import('./Models').SearchOptions} SearchOptions */
/** @typedef {import('./spreadsheets').SpreadsheetsClient} SpreadsheetsClient */
/** @typedef {import('./utils').SheetStackLogger} SheetStackLogger */

const cache = new NodeCache({
  maxKeys: 1000,
  stdTTL: 45,
});

const IS_NUMBER_PATTERN = /^-?[0-9]+(?:.[0-9]+)?$/;
const IS_BOOLEAN_PATTERN = /^(?:true|false)$/i;
const IS_TRUE_PATTERN = /true/i;

/**
 *
 * @param {string[]} headers
 * @param {string[][]} rows
 * @param {number} offset
 * @returns {Object[]}
 */
const mapRows = (headers, rows, offset) =>
  rows.map((row, i) => {
    const item = { _row: i + offset + 2 };
    for (let i = 0; i < headers.length; i++) {
      if (IS_NUMBER_PATTERN.test(row[i])) {
        item[headers[i]] = Number(row[i]);
      } else if (IS_BOOLEAN_PATTERN.test(row[i])) {
        item[headers[i]] = IS_TRUE_PATTERN.test(row[i]);
      } else {
        // is string
        item[headers[i]] = row[i];
      }
    }
    return item;
  });

/**
 *
 * @param {string[]} headers
 * @param {Object[]} data
 * @returns {string[][]}
 */
const mapValues = (headers, data) => {
  let values;
  const mapRow = (item) => headers.map((name) => safeGet(item, name, ""));
  if (_.isArray(data)) {
    values = data.map(mapRow);
  } else {
    values = [mapRow(data)];
  }
  return values;
};

const toHeaderRange = (sheetName) => `${sheetName}!A1:Z1`;
const toHeaderCacheKey = (spreadsheetId, sheetName) =>
  `${spreadsheetId}:${sheetName}:H`;
const toMetaCacheKey = (spreadsheetId, sheetName) =>
  `${spreadsheetId}:${sheetName}:M`;

class BasicDatabase {
  /**
   * @param {SpreadsheetsClient} cli
   * @param {SheetStackLogger} [logger]
   */
  constructor(cli, logger = DEFAULT_LOGGER) {
    /**
     * @private
     * @type {SpreadsheetsClient}
     */
    this.cli = cli;
    /**
     * @private
     * @type {SheetStackLogger}
     */
    this.logger = logger;
  }

  /**
   *
   * @param {string} spreadsheetId
   * @param {string} sheetName
   * @returns {Promise<string[]>}
   */
  async getHeaders(spreadsheetId, sheetName) {
    const cacheKey = toHeaderCacheKey(spreadsheetId, sheetName);
    let headers = cache.get(cacheKey);
    if (!headers) {
      headers = await this.cli.read(spreadsheetId, toHeaderRange(sheetName));
      cache.set(cacheKey, headers);
    }
    return headers[0];
  }

  /**
   *
   * @param {string} spreadsheetId
   * @param {string} sheetName
   * @returns {Promise<BasicDbMeta>}
   */
  async getMeta(spreadsheetId, sheetName) {
    const cacheKey = toMetaCacheKey(spreadsheetId, sheetName);
    let meta = cache.get(cacheKey);
    if (!meta) {
      const details = await this.cli.sheetDetails(spreadsheetId);
      const headers = await this.getHeaders(spreadsheetId, sheetName);
      meta = {
        ...details,
        tab: sheetName,
        headers,
      };
      cache.set(cacheKey, meta);
    }
    return meta;
  }

  /**
   *
   * @param {string} spreadsheetId
   * @param {string} sheetName
   * @param {number} _row
   * @returns {Promise<Object>}
   */
  async get(spreadsheetId, sheetName, _row) {
    const headers = await this.getHeaders(spreadsheetId, sheetName);
    const range = `${sheetName}!A${_row}:Z${_row}`;
    const rows = await this.cli.read(spreadsheetId, range);
    const data = mapRows(headers, rows, _row - 2);
    return data[0] || {};
  }

  /**
   * @param {string} spreadsheetId
   * @param {string} sheetName
   * @param {PaginationOptions} [options={}]
   * @returns {Promise<any[]>}
   */
  async list(spreadsheetId, sheetName, options = {}) {
    const { limit = 10, offset = 0 } = options;
    const headers = await this.getHeaders(spreadsheetId, sheetName);
    const range = `${sheetName}!A${2 + offset}:Z${2 + offset + limit - 1}`;
    const rows = await this.cli.read(spreadsheetId, range);
    const data = mapRows(headers, rows, offset);
    return data;
  }
  /**
   * @param {string} spreadsheetId
   * @param {string} sheetName
   * @param {SearchOptions} [options={}]
   * @returns {Promise<any[]>}
   */
  async search(spreadsheetId, sheetName, options = {}) {
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
  /**
   *
   * @param {string} spreadsheetId
   * @param {string} sheetName
   * @param {Object | Object[]} data
   * @returns {Promise<BasicDbAppendResult>}
   */
  async insert(spreadsheetId, sheetName, data) {
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
  /**
   *
   * @param {string} spreadsheetId
   * @param {string} sheetName
   * @param {number} _row
   * @param {Object} item
   * @returns {Promise<Boolean>}
   */
  async update(spreadsheetId, sheetName, _row, item) {
    const headers = await this.getHeaders(spreadsheetId, sheetName);
    const values = mapValues(headers, item);
    const res = await this.cli.write(
      spreadsheetId,
      `${sheetName}!A${_row}`,
      values
    );
    return res.updatedRows === 1;
  }
}

module.exports = { BasicDatabase };
