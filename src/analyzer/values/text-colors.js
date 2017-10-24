const arrayUniq = require('array-uniq')
const utils = require('../../utils/css')

const keywords = utils.KEYWORDS

module.exports = declarations => {
  const all = declarations
    .filter(d => ['color'].includes(d.property))
    .filter(v => !keywords.includes(v))

  const unique = arrayUniq(all).sort()

  return {
    total: all.length,
    unique,
    totalUnique: unique.length
  }
}
