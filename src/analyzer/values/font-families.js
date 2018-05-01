const expand = require('css-shorthand-expand')
const uniquer = require('../../utils/uniquer')
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

  const all = _all.filter(v => !cssKeywords.includes(v))

  return {
    total: all.length,
    ...uniquer(all)
  }
}
