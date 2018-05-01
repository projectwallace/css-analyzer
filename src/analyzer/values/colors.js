const uniquer = require('../../utils/uniquer')
const utils = require('../../utils/css')

const colorUtils = utils.color
const cssKeywords = colorUtils.keywords
const colorProperties = colorUtils.properties

module.exports = declarations => {
  const _all = []

  declarations.forEach(declaration => {
    const value = declaration.value

    // Try to get a direct color
    if (colorProperties.includes(declaration.property)) {
      _all.push(value)
      return
    }

    // Try all regexes for keywords, hsl(a), rgb(a) and hex(a)
    Object.values(colorUtils.regex).forEach(regex => {
      let matches = regex.exec(value)

      while (matches) {
        _all.push(matches[0])
        matches = regex.exec(value)
      }
    })
  })

  const all = _all.filter(v => Boolean(v) && !cssKeywords.includes(v))

  return {
    total: all.length,
    ...uniquer(all)
  }
}
