const postcss = require('postcss')
const atRules = require('./atrules')
const rules = require('./rules')
const selectors = require('./selectors')
const declarations = require('./declarations')

function processNodes(tree) {
  return {
    atRules: atRules(tree),
    rules: rules(tree),
    selectors: selectors(tree),
    declarations: declarations(tree)
  }
}

module.exports = async css => {
  try {
    const result = await postcss.parse(css)
    const rootNode = result.toResult().root

    return Promise.resolve(processNodes(rootNode))
  } catch (error) {
    const {source, line, column, reason} = error

    return Promise.reject(
      new SyntaxError(
        `${reason} at line ${line}, column ${column}. Source: ${source}`
      )
    )
  }
}
