const isVendorPrefixed = require('is-vendor-prefixed')
const uniquer = require('../../utils/uniquer')

module.exports = properties => {
  const all = properties.filter(isVendorPrefixed)
  const share = properties.length === 0 ? 0 : all.length / properties.length

  return {
    total: all.length,
    ...uniquer(all),
    share
  }
}
