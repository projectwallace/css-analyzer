const isEmpty = rule => {
  return rule.declarationsCount === 0
}

module.exports = rules => {
  const all = rules
  const empty = rules.filter(isEmpty)

  const selectorsPerRule = rules.map(({selectorsCount}) => selectorsCount)

  return {
    total: all.length,
    empty: {
      total: empty.length
    },
    selectors: {
      min: selectorsPerRule.length > 0 ? Math.min(...selectorsPerRule) : 0,
      max: selectorsPerRule.length > 0 ? Math.max(...selectorsPerRule) : 0,
      average:
        selectorsPerRule.length > 0
          ? selectorsPerRule.reduce((acc, curr) => acc + curr, 0) / rules.length
          : 0
    }
  }
}
