/**
 * Convert a string to a number
 * @param {string} str
 * @returns {number} the hashed string
 * @see https://stackoverflow.com/a/51276700
 */
function hash(str) {
  let hash = 0x811c9dc5
  var prime = 0x000193

  for (let i = 0; i < str.length; i++) {
    hash = hash ^ str.charCodeAt(i)
    hash *= prime
  }

  return hash
}

export class OccurrenceCounter {
  constructor() {
    this._items = Object.create(null)
  }

  /**
   * Converting the CSS string to an integer because this collection potentially
   * becomes very large and storing the values as integers saves 10-70%
   *
   * @see https://github.com/projectwallace/css-analyzer/pull/242
   * @param {string} item
   * @returns {number} the count for this item
   */
  push(item) {
    const key = hash(item)

    if (this._items[key]) {
      return this._items[key]++
    }

    return this._items[key] = 1
  }

  count() {
    return Object.keys(this._items).length
  }
}
