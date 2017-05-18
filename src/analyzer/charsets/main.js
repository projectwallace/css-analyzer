const Collection = require('css-collection')

module.exports = stylesheet => {
  const all = new Collection(stylesheet.rules)
    .filter(rule => rule.type === 'charset')

  const unique = all.uniqueOn('charset')

  return {
    total: all.size(),
    unique: unique.toArray(),
    totalUnique: unique.size()
  }
}
