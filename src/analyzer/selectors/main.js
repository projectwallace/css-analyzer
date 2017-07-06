const Collection = require('css-collection')

module.exports = selectors => {
  const all = new Collection(selectors)
  const unique = all.unique()
  const js = require('./js')(all)
  const id = require('./id')(all)
  const universal = require('./universal')(all)
  const specificity = require('./specificity')(all)

  return {
    total: all.size(),
    totalUnique: unique.size(),
    js,
    id,
    universal,
    specificity
  }
}
