class CountableCollection {
  /**
   * @param {string[]} initial
   */
  constructor(initial) {
    /** @type [index: string]: string */
    this._items = new Map()
    /** @type number */
    this._total = 0

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

    if (this._items.has(item)) {
      this._items.set(item, this._items.get(item) + 1)
      return
    }

    this._items.set(item, 1)
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
      totalUnique: this._items.size,
      unique: Object.fromEntries(this._items),
      uniquenessRatio: this._total === 0 ? 0 : this._items.size / this._total,
    }
  }
}

export {
  CountableCollection
}