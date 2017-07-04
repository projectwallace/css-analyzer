const Collection = require('css-collection')

module.exports = atRules => {
  const all = new Collection(atRules)
    .filter(rule => rule.type === 'font-face')
    .map(rule => rule.params)

  return {
    total: all.size()
  }
}
