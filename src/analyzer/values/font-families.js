const expand = require('css-shorthand-expand')
const uniquer = require('../../utils/uniquer')
const {KEYWORDS} = require('../../utils/css')

module.exports = declarations => {
  const all = declarations.reduce((previous, {property, value}) => {
    if (KEYWORDS.includes(value)) {
      return previous
    }

    if (property === 'font-family') {
      previous = [...previous, value]
    }

    if (property === 'font') {
      const expanded = expand('font', value)

      if (expanded) {
        previous = [...previous, expanded['font-family']]
      }
    }

    return previous
  }, [])

  return {
    total: all.length,
    ...uniquer(all)
  }
}
