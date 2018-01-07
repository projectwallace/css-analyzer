const arrayUniq = require('array-uniq')

module.exports = declarations => {
  const all = declarations
    .map(declaration => declaration.property)

  const unique = arrayUniq(all).sort()
  const prefixed = require('./prefixed')(all)

  return {
    total: all.length,
    unique,
    totalUnique: unique.length,
    prefixed
  }
}
