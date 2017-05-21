const Collection = require('css-collection')

module.exports = rules => {
  // Prepare all selectors by traversing all rules
  const _all = (() => {
    const collection = []

    if (rules.length === 0) {
      return []
    }

    rules.forEach(rule => {
      const selectors = rule.selectors
      while (selectors.length) {
        collection.push(selectors.shift())
      }
    })

    return collection
  })()

  const all = new Collection(_all)
  const unique = all.unique()
  const js = require('./js')(all)
  const id = require('./id')(all)
  const universal = require('./universal')(all)
  const specificity = require('./specificity')(all)

  return {
    stats: {
      total: all.size(),
      totalUnique: unique.size(),
      js,
      id,
      universal,
      specificity
    }
  }
}
