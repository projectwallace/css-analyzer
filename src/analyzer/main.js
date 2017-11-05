const parser = require('../parser')

module.exports = input => {
  return new Promise(async (resolve, reject) => {
    try {
      const css = await parser(input)

      const charsets = require('./charsets/main')(css.atRules)
      const documents = require('./documents/main')(css.atRules)
      const fontfaces = require('./fontfaces/main')(css.atRules)
      const imports = require('./imports/main')(css.atRules)
      const keyframes = require('./keyframes/main')(css.atRules)
      const mediaqueries = require('./mediaqueries/main')(css.atRules)
      const namespaces = require('./namespaces/main')(css.atRules)
      const pages = require('./pages/main')(css.atRules)
      const supports = require('./supports/main')(css.atRules)
      const rules = require('./rules/main')(css.rules)
      const selectors = require('./selectors/main')(css.selectors)
      const declarations = require('./declarations/main')(css.declarations)
      const properties = require('./properties/main')(css.declarations)
      const values = require('./values/main')(css.declarations)
      const stylesheets = require('./stylesheets/main')(
        input,
        rules,
        selectors,
        declarations
      )

      resolve({
        stylesheets,
        charsets,
        documents,
        fontfaces,
        imports,
        keyframes,
        mediaqueries,
        namespaces,
        pages,
        supports,
        rules,
        selectors,
        declarations,
        properties,
        values
      })
    } catch (err) {
      reject(err)
    }
  })
}
