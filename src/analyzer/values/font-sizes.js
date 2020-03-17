const expand = require('css-shorthand-expand')
const unitSort = require('css-unit-sort')
const uniquer = require('../../utils/uniquer')
const {KEYWORDS} = require('../../utils/css')

module.exports = declarations => {
  const all = declarations.reduce((previous, {property, value}) => {
    if (KEYWORDS.includes(value)) {
      return previous
    }

    if (property === 'font-size') {
      previous = [...previous, value]
    }

    if (property === 'font') {
      const expanded = expand('font', value)

      if (expanded) {
        previous = [...previous, expanded['font-size']]
      }
    }

    return previous
  }, [])

  return {
    total: all.length,
    ...uniquer(all, unitSort.sortFn)
  }
}
