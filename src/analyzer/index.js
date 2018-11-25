const parser = require('../parser')

module.exports = input => {
  return new Promise(async (resolve, reject) => {
    try {
      const css = await parser(input)

      const atrules = require('./atrules')(css.atRules)
      const rules = require('./rules')(css.rules)
      const selectors = require('./selectors')(css.selectors)
      const declarations = require('./declarations')(css.declarations)
      const properties = require('./properties')(css.declarations)
      const values = require('./values')(css.declarations)
      const stylesheets = require('./stylesheets')(
        input,
        atrules,
        rules,
        selectors,
        declarations,
        properties,
        values
      )

      resolve({
        stylesheets,
        atrules,
        rules,
        selectors,
        declarations,
        properties,
        values
      })
    } catch (error) {
      reject(error)
    }
  })
}
