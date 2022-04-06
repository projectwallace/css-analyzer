import { CountableCollection } from './countable-collection.js'

class ContextCollection {
  constructor() {
    this._list = new CountableCollection()
    /** @type {[index; string]: CountableCollection} */
    this._contexts = {}
  }

  /**
   * Add an item to this _list's context
   * @param {string} item Item to push
   * @param {string} context Context to push Item to
   */
  push(item, context) {
    this._list.push(item)

    if (!this._contexts[context]) {
      this._contexts[context] = new CountableCollection()
    }

    this._contexts[context].push(item)
  }

  count() {
    /** @type {[index: string]: string} */
    const itemsPerContext = {}

    for (let context in this._contexts) {
      itemsPerContext[context] = this._contexts[context].count()
    }

    return Object.assign(this._list.count(), {
      itemsPerContext
    })
  }
}

export {
  ContextCollection
}