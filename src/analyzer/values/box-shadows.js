const uniquer = require('../../utils/uniquer')
const {KEYWORDS} = require('../../utils/css')

module.exports = declarations => {
  const all = declarations
    .filter(({property}) => property === 'box-shadow')
    .filter(({value}) => !KEYWORDS.includes(value))
    .map(declaration => declaration.value)

  const {unique, totalUnique} = uniquer(all)

  return {
    total: all.length,
    unique,
    totalUnique
  }
}
