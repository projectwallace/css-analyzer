const isVendorPrefixed = require('is-vendor-prefixed')
const uniquer = require('../../utils/uniquer')

module.exports = properties => {
  const all = properties.filter(isVendorPrefixed)

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
