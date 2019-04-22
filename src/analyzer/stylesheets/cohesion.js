module.exports = rules => {
  const totalRules = rules.length
  const totalDeclarations =
    totalRules === 0
      ? 0
      : rules.reduce((acc, curr) => acc + curr.declarations.length, 0)
  const rulesSortedByDeclarationCount = rules.sort(
    (a, b) => b.declarations.length - a.declarations.length
  )

  if (totalRules === 0 || totalDeclarations === 0) {
    return {
      average: 0,
      min: {
        count: 0,
        value: null
      }
    }
  }

  const [ruleWithMostDeclarations] = rulesSortedByDeclarationCount

  return {
    average: totalDeclarations / totalRules,
    min: {
      count: ruleWithMostDeclarations.declarations.length,
      value: ruleWithMostDeclarations
    }
  }
}
