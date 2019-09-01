const {compare, calculate} = require('specificity')
const uniquer = require('../../utils/uniquer')

module.exports = selectors => {
  if (selectors.length === 0) {
    return {
      max: {
        count: 0,
        selectors: [],
        value: null
      },
      top: []
    }
  }

  const all = uniquer(selectors)
    .unique.map(({value, count}) => {
      const [a, b, c, d] = calculate(value).shift().specificityArray

      return {
        count,
        value,
        specificity: {a, b, c, d}
      }
    })
    .sort((a, b) => compare(b.value, a.value))

  const [maxSpecificitySelector] = all
  const maxSpecificity = maxSpecificitySelector.specificity
  const maxSpecificitySelectors = all.filter(
    selector => compare(selector.value, maxSpecificitySelector.value) === 0
  )

  return {
    top: [...all].slice(0, 5),
    max: {
      value: maxSpecificity,
      count: maxSpecificitySelectors.length,
      selectors: maxSpecificitySelectors
    }
  }
}
