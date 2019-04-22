const {isKeyframes} = require('./atrules')
const getDeclarationsFromRule = require('./declarations')
const {getSelectorsFromRule} = require('./selectors')

module.exports = tree => {
  const rules = []

  tree.walkRules(rule => {
    const declarations = getDeclarationsFromRule(rule)
    // Don't include the 'selectors' (from, 50%, to, etc.) inside @keyframes
    const selectors = isKeyframes(rule) ? [] : getSelectorsFromRule(rule)

    rules.push({declarations, selectors})
  })

  return rules
}
