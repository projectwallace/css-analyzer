module.exports = declarations => {
  const all = declarations.map(({value}) => value)

  const prefixed = require('./prefixed.js')(all)
  const fontsizes = require('./font-sizes.js')(declarations)
  const fontfamilies = require('./font-families.js')(declarations)
  const colors = require('./colors.js')(declarations)
  const browserhacks = require('./browserhacks.js')(declarations)
  const boxshadows = require('./box-shadows.js')(declarations)
  const textshadows = require('./text-shadows.js')(declarations)
  const zindexes = require('./z-indexes.js')(declarations)

  return {
    total: all.length,
    prefixed,
    fontsizes,
    fontfamilies,
    colors,
    browserhacks,
    boxshadows,
    textshadows,
    zindexes
  }
}
