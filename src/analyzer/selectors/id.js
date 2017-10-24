const arrayUniq = require('array-uniq')

const ID_RE = /(?![^[]*])#/

module.exports = selectors => {
  const all = selectors.filter(selector => selector.match(ID_RE))
  const unique = arrayUniq(all).sort()

  return {
    total: all.length,
    unique,
    totalUnique: unique.length
  }
}
