import { Collection } from './new-collection.js'

class ContextCollection {
  constructor() {
    this._list = new Collection()
    /** @type {Map<string, Collection>} */
    this._contexts = new Map()
  }

  /**
   * Add an item to this _list's context
   * @param {string} item Item to push
   * @param {string} context Context to push Item to
   * @param {import('css-tree').CssLocation} node_location
   */
  push(item, context, node_location) {
    this._list.add(item, node_location)
    let match = this._contexts.get(context)

    if (!match) {
      match = new Collection()
      this._contexts.set(context, match)
    }

    match.add(item, node_location)
  }
}

export {
  ContextCollection
}