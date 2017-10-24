const arrayUniq = require('array-uniq')

const PREFIX_RE = /^-(?:webkit|moz|ms|o)-/

module.exports = properties => {
  const all = properties.filter(property => property.match(PREFIX_RE))
  const unique = arrayUniq(all).sort()

  const share = (() => {
    if (properties.length === 0) {
      return 0
    }

    return all.length / properties.length
  })()

  return {
    total: all.length,
    unique,
    totalUnique: unique.length,
    share
  }
}
