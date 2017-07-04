module.exports = tree => {
  const atrules = []

  tree.walkAtRules(rule => {
    atrules.push({
      type: rule.name.trim(),
      params: rule.params.trim()
    })
  })

  return atrules
}
