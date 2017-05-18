const Collection = require('css-collection')
const utils = require('../../utils/css')

const cssKeywords = utils.color.keywords
const colorProperties = utils.color.properties
const stripImportant = utils.stripImportant

module.exports = declarations => {
  const _all = []

  declarations.forEach(declaration => {
    const value = stripImportant(declaration.value)

    // Try to get a direct color
    if (colorProperties.includes(declaration.property)) {
      _all.push(value)
      return
    }

    // COLOR NAMES
    const nameRegex = utils.color.regex.name
    let keywordMatches = nameRegex.exec(value)
    while (keywordMatches) {
      _all.push(keywordMatches[0])
      keywordMatches = nameRegex.exec(value)
    }

    // HEX(A)
    const hexRegex = utils.color.regex.hex
    let hexMatches = hexRegex.exec(value)
    while (hexMatches) {
      _all.push(hexMatches[0])
      hexMatches = hexRegex.exec(value)
    }

    // RGB(A)
    const rgbRegex = utils.color.regex.rgb
    let rgbMatches = rgbRegex.exec(value)
    while (rgbMatches) {
      _all.push(rgbMatches[0])
      rgbMatches = rgbRegex.exec(value)
    }

    // HSL(A)
    const hslRegex = utils.color.regex.hsl
    let hslMatches = hslRegex.exec(value)
    while (hslMatches) {
      _all.push(hslMatches[0])
      hslMatches = hslRegex.exec(value)
    }
  })

  const all = new Collection(_all)
    .filter(v => Boolean(v) && !cssKeywords.includes(v))

  const unique = all.unique()

  return {
    total: all.size(),
    unique: unique.toArray(),
    totalUnique: unique.size()
  }
}
