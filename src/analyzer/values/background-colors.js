const expand = require('css-shorthand-expand')
const arrayUniq = require('array-uniq')
const utils = require('../../utils/css')

const cssColorKeywords = utils.COLOR_KEYWORDS

const BACKGROUND_COLOR_PROP = 'background-color'
const BACKGROUND_SHORTHAND_PROP = 'background'
const BACKGROUND_PROPS = [BACKGROUND_COLOR_PROP, BACKGROUND_SHORTHAND_PROP]

module.exports = declarations => {
  const all = declarations
    .filter(d => BACKGROUND_PROPS.includes(d.property))
    .map(d => {
      const value = d.value

      if (d.property === BACKGROUND_COLOR_PROP) {
        return value
      }

      if (d.property === BACKGROUND_SHORTHAND_PROP && value !== 0) {
        // `expand()` fails on `background:0`, so we wrap it in a try-catch,
        // but it passes down `null` values, which we then have to filter out
        try {
          const background = expand(value)
          if (background[BACKGROUND_COLOR_PROP]) {
            return background[BACKGROUND_COLOR_PROP]
          }
        } catch (err) {}
      }

      return null
    })
    // Filter out null values and css keywords
    .filter(v => Boolean(v) && !cssColorKeywords.includes(v))

  const unique = arrayUniq(all).sort()

  return {
    total: all.length,
    unique,
    totalUnique: unique.length
  }
}
