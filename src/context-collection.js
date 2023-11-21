import { Collection } from './collection.js'

class ContextCollection {
  constructor({ l = false }) {
    this._list = new Collection({ l })
    /** @type {Map<string, Collection>} */
    this._contexts = new Map()
    /** @type {boolean} */
    this._useLocations = l
  }

  /**
   * Add an item to this _list's context
   * @param {string} item Item to push
   * @param {string} context Context to push Item to
   * @param {import('css-tree').CssLocation} node_location
   */
  push(item, context, node_location) {
    this._list.push(item, node_location)

    if (!this._contexts.has(context)) {
      this._contexts.set(context, new Collection({ l: this._useLocations }))
    }

    this._contexts.get(context).push(item, node_location)
  }

  count() {
    /**
     * @type {Map<string, {
     * total: number,
     * totalUnique: number,
     * unique: Record<string, number>,
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