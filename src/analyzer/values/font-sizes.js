const expand = require('css-shorthand-expand')
const unitSort = require('css-unit-sort')
const uniquer = require('../../utils/uniquer')
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

  const all = _all.filter(v => !keywords.includes(v))

  return {
    total: all.length,
    ...uniquer(all, unitSort.sortFn)
  }
}
