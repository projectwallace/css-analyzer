const arrayUniq = require('array-uniq')

const JS_REGEX = /[.|#|(?:="|')]js/i

module.exports = selectors => {
  const all = selectors.filter(selector => JS_REGEX.test(selector))
  const unique = arrayUniq(all).sort()

  return {
    total: all.length,
    unique,
    totalUnique: unique.length
  }
}
