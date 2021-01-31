const {parse} = require('postcss')
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
    const result = await parse(css)
    const rootNode = result.toResult().root

    return Promise.resolve(processNodes(rootNode))
  } catch (error) {
    const {line, column, reason} = error
    const message = error.showSourceCode
      ? `${reason} at line ${line}, column ${column}:\n\n${error.showSourceCode(
        false
      )}`
      : `${reason} at line ${line}, column ${column}:\n\n${error.source}`

    return Promise.reject(new SyntaxError(message))
  }
}
