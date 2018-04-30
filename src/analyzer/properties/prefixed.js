const uniquer = require('../../utils/uniquer')

const PREFIXED_REGEX = /^-(?:webkit|moz|ms|o)-/

module.exports = properties => {
  const all = properties
    .filter(property => PREFIXED_REGEX.test(property))

  const share = (() => {
    if (properties.length === 0) {
      return 0
    }

    return all.length / properties.length
  })()

  return {
    total: all.length,
    ...uniquer(all),
    share
  }
}
