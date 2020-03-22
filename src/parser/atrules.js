const declarations = require('./declarations')

const AT_RULES_WITH_DECLARATIONS = ['font-face']

function addDeclarations(atRule, tree) {
  if (!AT_RULES_WITH_DECLARATIONS.includes(atRule.type)) {
    return atRule
  }

  return {
    ...atRule,
    declarations: declarations(tree)
  }
}

module.exports = tree => {
  const atRules = []

  tree.walkAtRules(rule => {
    const atRule = {
      type: rule.name.trim(),
      params: rule.params.trim()
    }

    return atRules.push(addDeclarations(atRule, rule))
  })

  return atRules
}

module.exports.isKeyframes = rule => {
  return (
    rule.parent &&
    rule.parent.type === 'atrule' &&
    rule.parent.name.includes('keyframes')
  )
}
