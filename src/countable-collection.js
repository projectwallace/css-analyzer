class CountableCollection {
  /**
   * @param {string[]} initial
   */
  constructor(initial) {
    /** @type [index: string]: string */
    this._items = {}
    /** @type number */
    this._total = 0
    /** @type number */
    this._totalUnique = 0

    if (initial) {
      for (let i = 0; i < initial.length; i++) {
        this.push(initial[i])
      }
    }
  }

  /**
   * Push an item to the end of this collection
   * @param {string} item
   * @returns {void}
   */
  push(item) {
    this._total++

    if (this._items[item]) {
      this._items[item]++
      return
    }

    this._items[item] = 1
    this._totalUnique++
  }

  /**
   * Get the size of this collection
   * @returns {number} the size of this collection
   */
  size() {
    return this._total
  }

  /**
   * Get the counts of this collection, like total, uniques, etc.
   */
  count() {
    return {
      total: this._total,
      totalUnique: this._totalUnique,
      unique: this._items,
      uniquenessRatio: this._total === 0 ? 0 : this._totalUnique / this._total,
    }
  }
}

export {
  CountableCollection
}