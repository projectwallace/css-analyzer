module.exports = declarations => {
  const all = declarations
  const totalUnique = new Set(
    all.map(({property, value}) => `${property} : ${value}`)
  ).size
  const importants = require('./importants')(all)

  return {
    total: all.length,
    totalUnique,
    importants
  }
}
