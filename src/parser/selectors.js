module.exports = tree => {
  const selectors = []

  tree.walkRules(rule => {
    // Don't include the 'selectors' (from, 50%, to, etc.) inside @keyframes
    if (rule.parent &&
      rule.parent.type === 'atrule' &&
      rule.parent.name === 'keyframes') {
      return
    }

    // Get selectors: flatten the list, split each by ',' and trim the results
    selectors.push(
      ...rule.selector
        .split(',')
        .map(s => s.trim())
    )
  })

  return selectors
}
