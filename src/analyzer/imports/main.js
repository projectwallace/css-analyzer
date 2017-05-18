const Collection = require('css-collection')

module.exports = stylesheet => {
  const all = new Collection(stylesheet.rules)
    .filter(rule => rule.type === 'import')

  const unique = all.uniqueOn('import')

  return {
    total: all.size(),
    unique: unique.toArray(),
    totalUnique: unique.size()
  }
}
