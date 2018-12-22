const flat = require('flat')
const parser = require('../parser')

function flattenObject(obj) {
  return flat(obj, {safe: true})
}

module.exports = async rawCss => {
  try {
    const css = await parser(rawCss)

    const atrules = require('./atrules')(css.atRules)
    const rules = require('./rules')(css.rules)
    const selectors = require('./selectors')(css.selectors)
    const declarations = require('./declarations')(css.declarations)
    const properties = require('./properties')(css.declarations)
    const values = require('./values')(css.declarations)
    const stylesheets = require('./stylesheets')({
      rawCss,
      atrules,
      rules,
      selectors,
      declarations,
      properties,
      values
    })

    return Promise.resolve(
      flattenObject({
        stylesheets,
        atrules,
        rules,
        selectors,
        declarations,
        properties,
        values
      })
    )
  } catch (error) {
    return Promise.reject(error)
  }
}
