const specificity = require('specificity')
const {caseInsensitive: stringCompare} = require('string-natural-compare')

module.exports = selectors => {
  const totalSelectors = selectors.length
  const identifiersPerSelector = selectors
    .map(selector => specificity.calculate(selector).shift())
    .map(selector => {
      return {
        selector: selector.selector,
        identifiers: selector.parts.length
      }
    })

  const totalIdentifiers = identifiersPerSelector
    .map(selector => selector.identifiers)
    .reduce((prev, curr) => prev + curr, 0)
  const average = totalIdentifiers / totalSelectors

  const top = count => {
    // Sort by identifiers count, then by alphabet
    const sorter = (a, b) => {
      if (a.identifiers === b.identifiers) {
        return stringCompare(a, b)
      }

      return b.identifiers - a.identifiers
    }

    return identifiersPerSelector.sort(sorter).slice(0, count)
  }

  return {
    average,
    top: top(5)
  }
}
