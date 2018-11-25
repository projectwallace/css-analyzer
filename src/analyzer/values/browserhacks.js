const isBrowserHack = require('css-value-browser-h4cks-analyzer')
const uniquer = require('../../utils/uniquer')

module.exports = declarations => {
  const all = declarations
    .filter(declaration => isBrowserHack(declaration.value))
    .map(declaration => declaration.value)

  const {unique, totalUnique} = uniquer(all)

  return {
    total: all.length,
    unique,
    totalUnique
  }
}
