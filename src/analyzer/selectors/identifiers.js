const specificity = require('specificity')
const {caseInsensitive: stringCompare} = require('string-natural-compare')

// Sort by identifiers count, then by alphabet
function sortByIdentifiersCount(a, b) {
  if (a.count === b.count) {
    return stringCompare(a, b)
  }

  return b.count - a.count
}

function getSelectorSpecificity(selector) {
  return specificity.calculate(selector).shift()
}

module.exports = selectors => {
  const identifiersPerSelector = selectors
    .map(getSelectorSpecificity)
    .map(specificity => {
      return {
        value: specificity.selector,
        count: specificity.parts.length
      }
    })

  const totalIdentifiers = identifiersPerSelector
    .map(selector => selector.count)
    .reduce((prev, curr) => prev + curr, 0)

  const totalSelectors = selectors.length
  const average = totalIdentifiers / totalSelectors

  const sorted = identifiersPerSelector.sort(sortByIdentifiersCount)
  const [max] = sorted

  return {
    average,
    max,
    top: sorted.slice(0, 5)
  }
}
