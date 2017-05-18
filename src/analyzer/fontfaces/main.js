const Collection = require('css-collection')

module.exports = stylesheet => {
  const all = new Collection(stylesheet.rules)
    .filter(rule => rule.type === 'font-face')

  return {
    all: all.toArray(),
    stats: {
      total: all.size()
    }
  }
}
