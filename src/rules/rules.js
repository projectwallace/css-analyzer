import walk from 'css-tree/walker'

const analyzeRule = function (ruleNode) {
  let numSelectors = 0
  let numDeclarations = 0

  walk(ruleNode, function (childNode) {
    if (childNode.type === 'Selector') {
      numSelectors++
      return this.skip
    }

    if (childNode.type === 'Declaration') {
      numDeclarations++
      return this.skip
    }
  })

  return [numSelectors, numDeclarations]
}

export {
  analyzeRule,
}