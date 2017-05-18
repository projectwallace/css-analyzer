const Collection = require('css-collection')
const utils = require('../../utils/css')

const keywords = utils.KEYWORDS
const stripImportant = utils.stripImportant

module.exports = declarations => {
  const all = new Collection(declarations)
    .filter(d => ['color'].includes(d.property))
    .map(d => stripImportant(d.value))
    .filter(v => !keywords.includes(v))

  const unique = all.unique()

  return {
    total: all.size(),
    unique: unique.toArray(),
    totalUnique: unique.size()
  }
}
