const arrayUniq = require('array-uniq')

module.exports = declarations => {
  const all = declarations
  const importants = require('./importants')(all)
  const unique = arrayUniq(
    all.map(declaration => {
      return `${declaration.property} : ${declaration.value}`
    })
  ).sort()

  return {
    total: all.length,
    totalUnique: unique.length,
    importants
  }
}
