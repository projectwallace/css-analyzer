const selectorComplexity = require('css-selector-complexity')
const uniquer = require('../../utils/uniquer')

module.exports = selectors => {
  const all = selectors.map(selector => {
    let complexity = 0

    try {
      complexity = selectorComplexity(selector)
    } catch (error) {
      // Fail silently, ignoring the error
    }

    return {
      selector,
      complexity
    }
  })
  const allComplexities = all.map(selector => selector.complexity)
  const maxComplexity = all.length === 0 ? 0 : Math.max(...allComplexities)
  const {
    unique: mostComplexSelectors,
    totalUnique: mostComplexSelectorsCount
  } = uniquer(
    all
      .filter(({complexity}) => complexity === maxComplexity)
      .map(({selector}) => selector)
  )
  const unique = uniquer(allComplexities)
  const totalComplexity = allComplexities.reduce((acc, curr) => acc + curr, 0)
  const averageComplexityPerSelector =
    all.length === 0 ? 0 : totalComplexity / all.length

  return {
    max: {
      value: maxComplexity,
      selectors: mostComplexSelectors,
      count: mostComplexSelectorsCount
    },
    average: averageComplexityPerSelector,
    sum: totalComplexity,
    ...unique
  }
}
