class CountableCollection {
  /** @param {string[]?} initial */
  constructor(initial) {
    this._items = new Map()
    /** @type number */
    this._total = 0

    if (Array.isArray(initial)) {
      for (let i = 0; i < initial.length; i++) {
        this.push(initial[i])
      }
    }
  }

  /**
   * Push an item to the end of this collection
   * @param {string} item
   */
  push(item) {
    this._total++

    if (this._items.has(item)) {
      this._items.set(item, this._items.get(item) + 1)
      return
    }

    this._items.set(item, 1)
  }

  size() {
    return this._total
  }

  count() {
    return {
      total: this._total,
      totalUnique: this._items.size,
      /** @type Object */
      unique: Object.fromEntries(this._items),
      uniquenessRatio: this._total === 0 ? 0 : this._items.size / this._total,
    }
  }
}

export {
  CountableCollection
}