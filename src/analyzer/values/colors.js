const arrayUniq = require('array-uniq')
const utils = require('../../utils/css')

const cssKeywords = utils.color.keywords
const colorProperties = utils.color.properties

module.exports = declarations => {
  const _all = []

  declarations.forEach(declaration => {
    const value = declaration.value

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

  const all = _all
    .filter(v => Boolean(v) && !cssKeywords.includes(v))

  const unique = arrayUniq(all).sort()

  return {
    total: all.length,
    unique,
    totalUnique: unique.length
  }
}
