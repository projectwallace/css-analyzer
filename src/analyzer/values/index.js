module.exports = declarations => {
  const all = declarations
    .map(declaration => declaration.value)

  const prefixed = require('./prefixed')(all)
  const fontsizes = require('./font-sizes')(declarations)
  const fontfamilies = require('./font-families')(declarations)
  const colors = require('./colors')(declarations)

  return {
    total: all.length,
    prefixed,
    fontsizes,
    fontfamilies,
    colors
  }
}
