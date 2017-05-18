const Collection = require('css-collection')

module.exports = stylesheet => {
  const all = new Collection(stylesheet.rules)
    .filter(rule => rule.type === 'namespace')

  const unique = all.uniqueOn('namespace')

  return {
    total: all.size(),
    unique: unique.toArray(),
    totalUnique: unique.size()
  }
}
