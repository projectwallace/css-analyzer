const arrayUniq = require('array-uniq')

const UNIVERSAL_REGEX = /(?![^[]*])\*/

module.exports = selectors => {
  const all = selectors.filter(selector => UNIVERSAL_REGEX.test(selector))
  const unique = arrayUniq(all).sort()

  return {
    total: all.length,
    unique,
    totalUnique: unique.length
  }
}
