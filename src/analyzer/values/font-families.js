const expand = require('css-shorthand-expand')
const Collection = require('css-collection')
const utils = require('../../utils/css')

const cssKeywords = utils.KEYWORDS

module.exports = declarations => {
  const _all = (() => {
    const all = []

    declarations.forEach(declaration => {
      if (declaration.property === 'font-family') {
        return all.push(declaration.value)
      }

      if (declaration.property === 'font') {
        const font = expand('font', declaration.value)

        if (font && font['font-family']) {
          return all.push(font['font-family'])
        }
      }
    })

    return all
  })()

  const all = new Collection(_all)
    .filter(v => !cssKeywords.includes(v))

  const unique = all.unique()

  return {
    total: all.size(),
    unique: unique.toArray(),
    totalUnique: unique.size()
  }
}
