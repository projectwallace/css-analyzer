const arrayUniq = require('array-uniq')

const UNIVERSAL_RE = /(?![^[]*])\*/

module.exports = selectors => {
  const all = selectors
    .filter(selector => selector.match(UNIVERSAL_RE))
  const unique = arrayUniq(all).sort()

  return {
    total: all.length,
    unique,
    totalUnique: unique.length
  }
}
