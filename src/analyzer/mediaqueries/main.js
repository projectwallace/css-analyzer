const Collection = require('css-collection')

module.exports = stylesheet => {
  const all = new Collection(stylesheet.rules)
    .filter(rule => rule.type === 'media')

  const unique = all.uniqueOn('media')

  return {
    total: all.size(),
    unique: unique.toArray(),
    totalUnique: unique.size()
  }
}
