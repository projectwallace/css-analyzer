import { CountableCollection } from './countable-collection.js'

class ContextCollection {
  constructor() {
    this._list = new CountableCollection()
    /** @type {Map<string, CountableCollection>} */
    this._contexts = new Map()
  }

  /**
   * Add an item to this _list's context
   * @param {string} item Item to push
   * @param {string} context Context to push Item to
   */
  push(item, context) {
    this._list.push(item)

    if (!this._contexts.has(context)) {
      this._contexts.set(context, new CountableCollection())
    }

    this._contexts.get(context).push(item)
  }

  count() {
    /**
     * @type {Map<string, {
     * total: number,
     * totalUnique: number,
     * unique: {[string]: number},
     * uniquenessRatio: number
     * }>}
     */
    let itemsPerContext = new Map()

    for (let [context, value] of this._contexts.entries()) {
      itemsPerContext.set(context, value.count())
    }

    return Object.assign(this._list.count(), {
      itemsPerContext: Object.fromEntries(itemsPerContext)
    })
  }
}

export {
  ContextCollection
}