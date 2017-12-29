const arrayUniq = require('array-uniq')

const ID_REGEX = /(?![^[]*])#/

module.exports = selectors => {
  const all = selectors.filter(selector => ID_REGEX.test(selector))
  const unique = arrayUniq(all).sort()

  return {
    total: all.length,
    unique,
    totalUnique: unique.length
  }
}
