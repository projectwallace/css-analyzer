const Collection = require('css-collection')

module.exports = stylesheet => {
  const all = new Collection(stylesheet.rules)
    .filter(rule => rule.type === 'keyframes')

  const unique = all.uniqueOn('name')

  return {
    all: all.toArray(),
    stats: {
      total: all.size(),
      unique: unique.toArray(),
      totalUnique: unique.size()
    }
  }
}
