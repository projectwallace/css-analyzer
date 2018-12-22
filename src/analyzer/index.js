const flat = require('flat')
const parser = require('../parser')

function flattenObject(obj) {
  return flat(obj, {safe: true})
}

module.exports = rawCss => {
  return new Promise(async (resolve, reject) => {
    const css = await parser(rawCss).catch(error => reject(error))

    // CSS undefined means that PostCSS encountered an error
    if (typeof css === 'undefined') {
      return reject(new Error('Invalid CSS found, cannot analyze invalid CSS'))
    }

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

    return resolve(
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
  })
}
