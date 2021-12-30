class CountableCollection {
  constructor(initial) {
    this.items = {}
    this.total = 0
    this.totalUnique = 0

    if (initial) {
      for (let index = 0; index < initial.length; index++) {
        this.push(initial[index])
      }
    }
  }

  /**
   *
   * @param {string} item
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

  size() {
    return this.total
  }

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