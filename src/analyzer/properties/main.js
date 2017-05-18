const Collection = require('css-collection')

module.exports = declarations => {
  const all = new Collection(declarations)
    .map(declaration => declaration.property)

  const unique = all.unique()
  const prefixed = require('./prefixed')(all)

  return {
    total: all.size(),
    unique: unique.toArray(),
    totalUnique: unique.size(),
    prefixed
  }
}
