const uniquer = require('../../utils/uniquer')

module.exports = atRules => {
  const all = atRules
    .filter(rule => rule.type === 'page')
    .map(rule => rule.params)

  return {
    total: all.length,
    ...uniquer(all)
  }
}
