class CountableCollection {
  /**
   * @param {string[]} initial
   */
  constructor(initial) {
    /** @type [index: string]: string */
    this.items = {}
    /** @type number */
    this.total = 0
    /** @type number */
    this.totalUnique = 0

    if (initial) {
      for (let index = 0; index < initial.length; index++) {
        this.push(initial[index])
      }
    }
  }

  /**
   * Push an item to the end of this collection
   * @param {string} item
   * @returns {void}
   */
  push(item) {
    this.total++

    if (this.items[item]) {
      this.items[item]++
      return
    }

    this.items[item] = 1
    this.totalUnique++
  }

  /**
   * Get the size of this collection
   * @returns {number} the size of this collection
   */
  size() {
    return this.total
  }

  /**
   * Get the counts of this collection, like total, uniques, etc.
   */
  count() {
    return {
      total: this.total,
      totalUnique: this.totalUnique,
      unique: this.items,
      uniquenessRatio: this.total === 0 ? 0 : this.totalUnique / this.total,
    }
  }
}

export {
  CountableCollection
}