const uniquer = require('../../utils/uniquer')

module.exports = declarations => {
  const all = declarations
    .filter(({property}) => property === 'box-shadow')
    .map(declaration => declaration.value)

  const {unique, totalUnique} = uniquer(all)

  return {
    total: all.length,
    unique,
    totalUnique
  }
}
