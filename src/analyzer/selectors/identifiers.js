const specificity = require('specificity')
const {caseInsensitive: stringCompare} = require('string-natural-compare')

// Sort by identifiers count (high to low), then by alphabet (A-Z)
function sortByIdentifiersCount(a, b) {
  if (a.count === b.count) {
    return stringCompare(a.value, b.value)
  }

  return b.count - a.count
}

function getSelectorSpecificity(selector) {
  return specificity.calculate(selector).shift()
}

module.exports = selectors => {
  if (selectors.length === 0) {
    return {
      average: 0,
      top: [],
      max: {
        value: null,
        count: null
      }
    }
  }

  const identifiersPerSelector = selectors
    .map(getSelectorSpecificity)
    .map(specificity => ({
      value: specificity.selector,
      count: specificity.parts.length
    }))

  const totalIdentifiers = identifiersPerSelector
    .map(({count}) => count)
    .reduce((prev, curr) => prev + curr, 0)

  const sorted = identifiersPerSelector.sort(sortByIdentifiersCount)
  const [max] = sorted

  return {
    average: totalIdentifiers / selectors.length,
    max,
    top: sorted.slice(0, 5)
  }
}
