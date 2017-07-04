const postcss = require('postcss')

const atRules = []
const selectors = []
const declarations = []
const rules = []

function setAtRules(tree) {
  tree.walkAtRules(rule => {
    atRules.push({
      type: rule.name.trim(),
      params: rule.params.trim()
    })
  })
}

function setSelectors(tree) {
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
}

function setDeclarations(tree) {
  tree.walkDecls(declaration => {
    declarations.push({
      property: declaration.prop,
      value: declaration.value,
      important: Boolean(declaration.important)
    })
  })
}

function setRules(tree) {
  tree.walkRules(rule => {
    // Count declarations per rule
    let declarationsCount = 0
    rule.walkDecls(() => {
      declarationsCount += 1
    })
    rules.push({declarationsCount})
  })
}

function processNodes(tree) {
  setAtRules(tree)
  setRules(tree)
  setSelectors(tree)
  setDeclarations(tree)

  return {
    atRules,
    rules,
    selectors,
    declarations
  }
}

module.exports = css => {
  return new Promise((resolve, reject) => {
    postcss()
      .process(css)
      .then(result => {
        resolve(processNodes(result.root))
      })
      .catch(err => {
        reject(err)
      })
  })
}
