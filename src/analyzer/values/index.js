module.exports = declarations => {
  const all = declarations
    .map(declaration => declaration.value)

  const prefixed = require('./prefixed.js')(all)
  const fontsizes = require('./font-sizes.js')(declarations)
  const fontfamilies = require('./font-families.js')(declarations)
  const colors = require('./colors.js')(declarations)
  const browserhacks = require('./browserhacks.js')(declarations)

  return {
    total: all.length,
    prefixed,
    fontsizes,
    fontfamilies,
    colors,
    browserhacks
  }
}
