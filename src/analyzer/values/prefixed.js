const arrayUniq = require('array-uniq')

const PREFIX_RE = /^-(?:webkit|moz|ms|o)-/i

module.exports = values => {
  const all = values.filter(property => PREFIX_RE.test(property))
  const unique = arrayUniq(all).sort()

  const share = (() => {
    if (values.length === 0) {
      return 0
    }

    return all.length / values.length
  })()

  return {
    total: all.length,
    unique,
    totalUnique: unique.length,
    share
  }
}
