const Collection = require('css-collection')

module.exports = atRules => {
  const all = new Collection(atRules)
    .filter(rule => {
      return [
        'keyframes',
        '-moz-keyframes',
        '-webkit-keyframes',
        '-ms-keyframes',
        '-o-keyframes'
      ].includes(rule.type)
    })
    .map(rule => rule.params)

  const unique = all.unique()

  return {
    total: all.size(),
    unique: unique.toArray(),
    totalUnique: unique.size()
  }
}
