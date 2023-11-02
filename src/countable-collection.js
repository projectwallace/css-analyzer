class CountableCollection {

  /** @param {string[]?} initial */
  constructor(initial = undefined) {
    /** @type {Map<string, number>} */
    this._items = new Map()
    this._total = 0

    if (initial) {
      for (let i = 0; i < initial.length; i++) {
        this.push(initial[i])
      }
    }
  }

  /** @param {string} item */
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
      unique: Object.fromEntries(this._items),
      uniquenessRatio: this._total === 0 ? 0 : this._items.size / this._total,
    }
  }
}

export {
  CountableCollection
}