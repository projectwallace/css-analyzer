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

    // Try all regexes for hsl(a), rgb(a) and hex(a)
    Object.keys(utils.color.regex).forEach(reg => {
      const regex = utils.color.regex[reg]
      let matches = regex.exec(value)

      while (matches) {
        _all.push(matches[0])
        matches = regex.exec(value)
      }
    })
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
