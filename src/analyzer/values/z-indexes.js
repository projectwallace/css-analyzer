const uniquer = require('../../utils/uniquer')
const {KEYWORDS} = require('../../utils/css')

module.exports = declarations => {
  const all = declarations
    // Ignore all declarations that are not z-index
    .filter(({property}) => property === 'z-index')
    // Ignore all CSS keywords and globals
    .filter(({value}) => !KEYWORDS.includes(value))
    // Create a list of integers
    .map(({value}) => parseInt(value, 10))

  const {unique, totalUnique} = uniquer(all, (a, b) => a - b)

  return {
    total: all.length,
    unique,
    totalUnique
  }
}
