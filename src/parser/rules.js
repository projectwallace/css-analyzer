module.exports = tree => {
  const rules = []

  tree.walkRules(rule => {
    // Count declarations per rule
    let declarationsCount = 0
    rule.walkDecls(() => {
      declarationsCount += 1
    })
    rules.push({declarationsCount})
  })

  return rules
}
