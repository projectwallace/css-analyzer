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
