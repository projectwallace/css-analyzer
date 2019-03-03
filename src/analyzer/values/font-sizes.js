const expand = require('css-shorthand-expand')
const unitSort = require('css-unit-sort')
const uniquer = require('../../utils/uniquer')
const {KEYWORDS} = require('../../utils/css')

module.exports = declarations => {
  const all = declarations.reduce((prev, {property, value}) => {
    if (KEYWORDS.includes(value)) {
      return prev
    }

    if (property === 'font-size') {
      prev = [...prev, value]
    }

    if (property === 'font') {
      const {'font-size': size} = expand('font', value)
      prev = [...prev, size]
    }

    return prev
  }, [])

  return {
    total: all.length,
    ...uniquer(all, unitSort.sortFn)
  }
}
