const arrayUniq = require('array-uniq')

const JS_RE = /[.|#|(?:="|')]js/i

module.exports = selectors => {
  const all = selectors.filter(selector => selector.match(JS_RE))
  const unique = arrayUniq(all).sort()

  return {
    total: all.length,
    unique,
    totalUnique: unique.length
  }
}
