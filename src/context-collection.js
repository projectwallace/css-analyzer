import { CountableCollection } from './countable-collection.js'

class ContextCollection {
  constructor() {
    this.list = new CountableCollection()
    this.contexts = {}
    this.contextCount = 0
  }

  push(item, context) {
    this.list.push(item)

    if (!this.contexts[context]) {
      this.contexts[context] = new CountableCollection()
      this.contextCount++
    }

    this.contexts[context].push(item)
  }

  count() {
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