const vendorPrefixes = require('vendor-prefixes')()
const uniquer = require('../../utils/uniquer')

const PREFIX_REGEX = new RegExp(`^${vendorPrefixes.join('|')}`)

module.exports = values => {
  const all = values.filter(property => PREFIX_REGEX.test(property))

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
