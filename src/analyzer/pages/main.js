const Collection = require('css-collection')

module.exports = stylesheet => {
  const all = new Collection(stylesheet.rules)
    .filter(rule => rule.type === 'page')

  const unique = all
    .map(rule => `${rule.selectors.join(', ')}`)
    .unique()

  return {
    all: all.toArray(),
    stats: {
      total: all.size(),
      unique: unique.toArray(),
      totalUnique: unique.size()
    }
  }
}
