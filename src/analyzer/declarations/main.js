const Collection = require('css-collection')

module.exports = declarations => {
  const all = new Collection(declarations)
  const importants = require('./importants')(all)
  const unique = all.map(declaration => {
    return `${declaration.property} : ${declaration.value}`
  }).unique()

  return {
    total: all.size(),
    totalUnique: unique.size(),
    importants
  }
}
