const expand = require('css-shorthand-expand')
const uniquer = require('../../utils/uniquer')
const {KEYWORDS} = require('../../utils/css')

module.exports = declarations => {
  const all = declarations.reduce((prev, {property, value}) => {
    if (KEYWORDS.includes(value)) {
      return prev
    }

    if (property === 'font-family') {
      prev = [...prev, value]
    }

    if (property === 'font') {
      const expanded = expand('font', value)

      if (expanded) {
        prev = [...prev, expanded['font-family']]
      }
    }

    return prev
  }, [])

  return {
    total: all.length,
    ...uniquer(all)
  }
}
