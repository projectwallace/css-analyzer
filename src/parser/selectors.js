const {isKeyframes} = require('./atrules')

module.exports = tree => {
  const selectors = []

  tree.walkRules(rule => {
    // Don't include the 'selectors' (from, 50%, to, etc.) inside @keyframes
    if (isKeyframes(rule)) {
      return
    }

    // Get selectors: flatten the list, split each by ',' and trim the results
    selectors.push(...rule.selector.split(',').map(s => s.trim()))
  })

  return selectors
}
