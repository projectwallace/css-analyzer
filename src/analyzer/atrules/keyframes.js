const isVendorPrefixed = require('is-vendor-prefixed')
const uniquer = require('../../utils/uniquer')

module.exports = atRules => {
  const all = atRules.filter(rule => rule.type.includes('keyframes'))
  const prefixed = all
    .filter(rule => isVendorPrefixed(rule.type))
    .map(rule => `@${rule.type} ${rule.params}`)

  return {
    total: all.length,
    ...uniquer(all.map(rule => rule.params)),
    prefixed: {
      total: prefixed.length,
      ...uniquer(prefixed),
      share: prefixed.length === 0 ? 0 : all.length / prefixed.length
    }
  }
}
