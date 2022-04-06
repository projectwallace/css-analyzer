export class OccurrenceCounter {
  constructor() {
    this._items = Object.create(null)
  }

  push(item) {
    if (this._items[item]) {
      return this._items[item]++
    }

    return this._items[item] = 1
  }

  count() {
    return Object.keys(this._items).length
  }
}
