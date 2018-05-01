const uniquer = require('../../utils/uniquer')

const PREFIX_RE = /^-(?:webkit|moz|ms|o)-/i

module.exports = values => {
  const all = values.filter(property => PREFIX_RE.test(property))

  const share = (() => {
    if (values.length === 0) {
      return 0
    }

    return all.length / values.length
  })()

  return {
    total: all.length,
    ...uniquer(all),
    share
  }
}
