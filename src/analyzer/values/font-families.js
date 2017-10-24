const expand = require('css-shorthand-expand')
const arrayUniq = require('array-uniq')
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

  const all = _all
    .filter(v => !cssKeywords.includes(v))

  const unique = arrayUniq(all).sort()

  return {
    total: all.length,
    unique,
    totalUnique: unique.length
  }
}
