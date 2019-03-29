const {isKeyframes} = require('./atrules')

module.exports = tree => {
  const rules = []

  tree.walkRules(rule => {
    // Count declarations per rule
    let declarationsCount = 0

    rule.walkDecls(() => {
      declarationsCount += 1
    })

    // Count selectors per rule, but don't include the 'selectors'
    // (from, 50%, to, etc.) inside @keyframes
    const selectorsCount = isKeyframes(rule)
      ? 0
      : rule.selector.split(',').length

    rules.push({declarationsCount, selectorsCount})
  })

  return rules
}
