const Collection = require('css-collection')

module.exports = rules => {
  const all = new Collection(rules)

  return {
    total: all.size()
  }
}
