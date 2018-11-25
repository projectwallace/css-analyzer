const isBrowserHack = require('css-media-query-browser-h4cks-analyzer')
const uniquer = require('../../utils/uniquer')

module.exports = atRules => {
  const all = atRules
    .filter(rule => rule.type === 'media')
    .map(rule => rule.params)

  const browserhacks = all.filter(isBrowserHack)

  return {
    total: all.length,
    ...uniquer(all),
    browserhacks: {
      total: browserhacks.length,
      ...uniquer(browserhacks)
    }
  }
}
