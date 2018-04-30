const uniquer = require('../../utils/uniquer')

module.exports = atRules => {
  const all = atRules
    .filter(rule => rule.type === 'charset')
    .map(rule => rule.params)

  return {
    total: all.length,
    ...uniquer(all)
  }
}
