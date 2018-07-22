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

module.exports = css => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await postcss.parse(css)
      const rootNode = result.toResult().root
      resolve(processNodes(rootNode))
    } catch (err) {
      const {source, line, column, reason} = err
      reject(new SyntaxError(
        `${reason} at line ${line}, column ${column}. Source: ${source}`
      ))
    }
  })
}
