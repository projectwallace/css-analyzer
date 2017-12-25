const specificity = require('specificity')

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

  const top = function (count) {
    const sorter = function (a, b) {
      if (a.identifiers === b.identifiers) {
        return 0
      }

      return a.identifiers > b.identifiers ? -1 : 1
    }

    return identifiersPerSelector.sort(sorter).slice(0, count)
  }

  return {
    average,
    top: top(3)
  }
}
