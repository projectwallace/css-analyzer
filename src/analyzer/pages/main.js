const arrayUniq = require('array-uniq')

module.exports = atRules => {
  const all = atRules
    .filter(rule => rule.type === 'page')
    .map(rule => rule.params)

  const unique = arrayUniq(all).sort()

  return {
    total: all.length,
    unique,
    totalUnique: unique.length
  }
}
