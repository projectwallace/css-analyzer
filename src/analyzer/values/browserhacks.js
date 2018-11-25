const isBrowserHack = require('css-value-browser-h4cks-analyzer')
const uniquer = require('../../utils/uniquer')

module.exports = declarations => {
  const hacks = declarations
    .filter(declaration => isBrowserHack(declaration.value))
    .map(declaration => declaration.value)

  const {unique, totalUnique} = uniquer(hacks)

  return {
    total: hacks.length,
    unique,
    totalUnique
  }
}
