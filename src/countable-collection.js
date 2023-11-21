class CountableCollection {

  /** @param {string[]?} initial */
  constructor(initial) {
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
    let items = this._items
    let size = items.size
    let total = this._total

    return {
      total: total,
      totalUnique: size,
      unique: Object.fromEntries(items),
      uniquenessRatio: total === 0 ? 0 : size / total,
    }
  }
}

export {
  CountableCollection
}