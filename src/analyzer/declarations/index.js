module.exports = declarations => {
  const all = declarations
  const importants = require('./importants')(all)
  const unique = [...new Set(all.map(declaration => {
    return `${declaration.property} : ${declaration.value}`
  }))].sort()

  return {
    total: all.length,
    totalUnique: unique.length,
    importants
  }
}
