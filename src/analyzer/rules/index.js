const compareStrings = require('string-natural-compare')

const isEmpty = rule => {
  return rule.declarations.length === 0
}

module.exports = rules => {
  const all = rules
  const total = all.length
  const empty = rules.filter(isEmpty)

  // We only want to deal with rules that have selectors.
  // While parsing the CSS we have stripped the 'selectors' from
  // @keyframes, so we need to ignore the accompanying
  // declarations here too
  const rulesSortedBySelectorCount = [...all]
    .filter(({selectors}) => selectors.length > 0)
    .sort((a, b) => {
      if (a.selectors.length === b.selectors.length) {
        return compareStrings.caseInsensitive(
          a.selectors.join(''),
          b.selectors.join('')
        )
      }

      return a.selectors.length - b.selectors.length
    })
  const ruleWithLeastSelectors = [...rulesSortedBySelectorCount].shift()
  const ruleWithMostSelectors = [...rulesSortedBySelectorCount].pop()

  const selectorsPerRule = all.map(({selectors}) => selectors.length)
  const averageSelectorsPerRule =
    total === 0
      ? 0
      : selectorsPerRule.reduce((acc, curr) => acc + curr, 0) / total

  return {
    total,
    empty: {
      total: empty.length
    },
    selectors: {
      /** @deprecated */
      min: total === 0 ? 0 : ruleWithLeastSelectors.selectors.length,
      /** @deprecated */
      max: total === 0 ? 0 : ruleWithMostSelectors.selectors.length,
      average: averageSelectorsPerRule,
      minimum: {
        count: total === 0 ? 0 : ruleWithLeastSelectors.selectors.length,
        value: total === 0 ? [] : ruleWithLeastSelectors.selectors
      },
      maximum: {
        count: total === 0 ? 0 : ruleWithMostSelectors.selectors.length,
        value: total === 0 ? [] : ruleWithMostSelectors.selectors
      }
    }
  }
}
