const expand = require('css-shorthand-expand')
const uniquer = require('../../utils/uniquer')
const utils = require('../../utils/css')

const cssKeywords = utils.KEYWORDS

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
    .filter(value => !cssKeywords.includes(value))

  return {
    total: all.length,
    ...uniquer(all)
  }
}
