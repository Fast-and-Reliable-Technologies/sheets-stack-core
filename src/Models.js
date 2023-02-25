// @ts-check

/**
 * @typedef {object} SpreadsheetDetails
 * @property {string} spreadsheetId
 * @property {string} title
 * @property {SheetDetails[]} sheets
 * @property {string} spreadsheetUrl
 */

/**
 * @typedef {object} SheetDetails
 * @property {string} title
 */

/**
 * @typedef {object} SheetWriteResult
 * @property {number} updatedRows
 * @property {number} updatedColumns
 * @property {number} updatedCells
 */

/**
 * @typedef {object} SheetAppendResult
 * @property {string} updatedRange
 * @property {number} updatedRows
 * @property {number} updatedColumns
 * @property {number} updatedCells
 */

/**
 * @typedef {object} BasicDbMeta
 * @property {string} spreadsheetId
 * @property {string} title
 * @property {SheetDetails[]} sheets
 * @property {string} spreadsheetUrl
 * @property {string} tab
 * @property {string[]} headers
 */

/**
 * @typedef {object} BasicDbAppendResult
 * @property {number} updatedRows
 * @property {object[]} data
 */

/**
 * @typedef {object} ListsDbMeta
 * @property {string} spreadsheetId
 * @property {string} title
 * @property {SheetDetails[]} sheets
 * @property {string} spreadsheetUrl
 * @property {string} tab
 * @property {string[]} titles
 */

/**
 * @typedef {object} PaginationOptions
 * @property {number} [options.limit=25] Default `25`
 * @property {number} [options.offset=0] Default `0`
 */

/**
 * @typedef {object} SearchOptions
 * @property {number} [options.limit=25] Default `25`
 * @property {number} [options.offset=0] Default `0`
 * @property {string | string[]} [options.sort=[]] https://lodash.com/docs/4.17.15#sortBy
 * @property {boolean} [options.sortDesc=false]
 * @property {object} [options.filter={}] https://lodash.com/docs/4.17.15#filter
 * @property {object} [options.query={}] https://www.npmjs.com/package/lodash-query#query-api
 */

module.exports = {};
