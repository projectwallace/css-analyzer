import { CountableCollection } from './countable-collection.js'

class ContextCollection {
  constructor() {
    this.list = new CountableCollection()
    /** @type {[index; string]: CountableCollection} */
    this.contexts = {}
    this.contextCount = 0
  }

  /**
   * Add an item to this list's context
   * @param {string} item Item to push
   * @param {string} context Context to push Item to
   */
  push(item, context) {
    this.list.push(item)

    if (!this.contexts[context]) {
      this.contexts[context] = new CountableCollection()
      this.contextCount++
    }

    this.contexts[context].push(item)
  }

  count() {
    /** @type {[index: string]: string} */
    const itemsPerContext = {}

    for (let context in this.contexts) {
      itemsPerContext[context] = this.contexts[context].count()
    }

    return Object.assign(this.list.count(), {
      itemsPerContext
    })
  }
}

export {
  ContextCollection
}