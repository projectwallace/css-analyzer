const isBrowserHack = require('css-property-browser-h4cks-analyzer')
const uniquer = require('../../utils/uniquer')

module.exports = properties => {
  const all = properties.filter(isBrowserHack)
  const {unique, totalUnique} = uniquer(all)

  return {
    total: all.length,
    unique,
    totalUnique
  }
}
