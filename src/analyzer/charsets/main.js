const Collection = require('css-collection')

module.exports = atRules => {
  const all = new Collection(atRules)
    .filter(rule => rule.type === 'charset')
    .map(rule => rule.params)

  const unique = all.unique()

  return {
    total: all.size(),
    unique: unique.toArray(),
    totalUnique: unique.size()
  }
}
