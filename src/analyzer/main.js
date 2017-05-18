const parser = require('css')

module.exports = input => {
  const stylesheet = parser.parse(input).stylesheet

  const charsets = require('./charsets/main')(stylesheet)
  const documents = require('./documents/main')(stylesheet)
  const fontfaces = require('./fontfaces/main')(stylesheet)
  const imports = require('./imports/main')(stylesheet)
  const keyframes = require('./keyframes/main')(stylesheet)
  const mediaqueries = require('./mediaqueries/main')(stylesheet)
  const namespaces = require('./namespaces/main')(stylesheet)
  const pages = require('./pages/main')(stylesheet)
  const supports = require('./supports/main')(stylesheet)
  const rules = require('./rules/main')(stylesheet)
  const selectors = require('./selectors/main')(rules.all)
  const declarations = require('./declarations/main')(rules.all, fontfaces.all, keyframes.all, pages.all)
  const properties = require('./properties/main')(declarations.all)
  const values = require('./values/main')(declarations.all)
  const stylesheets = require('./stylesheets/main')(input, rules.stats, selectors.stats, declarations.stats)

  return {
    stylesheets,
    charsets,
    documents,
    fontfaces: fontfaces.stats,
    imports,
    keyframes: keyframes.stats,
    mediaqueries,
    namespaces,
    pages: pages.stats,
    supports,
    rules: rules.stats,
    selectors: selectors.stats,
    declarations: declarations.stats,
    properties,
    values
  }
}
