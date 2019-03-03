const expand = require('css-shorthand-expand')
const uniquer = require('../../utils/uniquer')
const {KEYWORDS} = require('../../utils/css')

module.exports = declarations => {
  const all = declarations
    .reduce((prev, {property, value}) => {
      if (property === 'font-family') {
        prev = [...prev, value]
      }

      if (property === 'font') {
        const expanded = expand('font', value)

        if (expanded && expanded['font-family']) {
          prev = [...prev, expanded['font-family']]
        }
      }

      return prev
    }, [])
    .filter(value => !KEYWORDS.includes(value))

  return {
    total: all.length,
    ...uniquer(all)
  }
}
