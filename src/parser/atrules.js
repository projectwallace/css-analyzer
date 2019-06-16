const AT_RULES_WITH_DESCRIPTORS = ['font-face']

function addDescriptorsToAtRuleFromTree(atRule, tree) {
  if (!AT_RULES_WITH_DESCRIPTORS.includes(atRule.type)) {
    return atRule
  }

  const descriptors = {}
  tree.walkDecls(declaration => {
    descriptors[declaration.prop] = declaration.value
  })

  return {
    ...atRule,
    descriptors
  }
}

module.exports = tree => {
  const atrules = []

  tree.walkAtRules(rule => {
    const atRule = {
      type: rule.name.trim(),
      params: rule.params.trim()
    }

    return atrules.push(addDescriptorsToAtRuleFromTree(atRule, rule))
  })

  return atrules
}

module.exports.isKeyframes = rule => {
  return (
    rule.parent &&
    rule.parent.type === 'atrule' &&
    rule.parent.name.includes('keyframes')
  )
}
