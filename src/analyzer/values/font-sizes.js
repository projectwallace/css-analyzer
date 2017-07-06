const expand = require('css-shorthand-expand')
const unitSort = require('css-unit-sort')
const Collection = require('css-collection')
const utils = require('../../utils/css')

const keywords = utils.KEYWORDS

module.exports = declarations => {
  const _all = (() => {
    const tmp = []

    declarations.forEach(declaration => {
      if (declaration.property === 'font-size') {
        return tmp.push(declaration.value)
      }

      if (declaration.property === 'font') {
        const font = expand('font', declaration.value)

        if (font && font['font-size']) {
          return tmp.push(font['font-size'])
        }
      }
    })

    return tmp
  })()

  const all = new Collection(_all)
    .filter(v => !keywords.includes(v))
  const unique = all.unique().sort(unitSort)

  return {
    total: all.size(),
    unique: unique.toArray(),
    totalUnique: unique.size()
  }
}
