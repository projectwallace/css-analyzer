const isBrowserHack = require('css-selector-browser-h4cks-analyzer')
const uniquer = require('../../utils/uniquer.js')

module.exports = selectors => {
  const all = selectors.filter(isBrowserHack)

  return {
    total: all.length,
    ...uniquer(all)
  }
}
