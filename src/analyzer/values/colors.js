const valueParser = require('postcss-values-parser')
const cssColorNames = require('css-color-names')
const tinycolor = require('tinycolor2')
const colorSorter = require('color-sorter')

const uniquer = require('../../utils/uniquer')

const CSS_COLOR_KEYWORDS = Object.keys(cssColorNames).map(color =>
  color.toLowerCase()
)
const CSS_COLOR_FUNCTIONS = ['hsl', 'hsla', 'rgb', 'rgba']

function prepareValue(value) {
  return value
    .toString()
    .toLowerCase()
    .trim()
}

function nodeIsHexColor(node) {
  return node.isColor
}

function nodeIsColorFn(node) {
  return (
    node.type === 'func' &&
    CSS_COLOR_FUNCTIONS.includes(prepareValue(node.value))
  )
}

function nodeIsKeyword(node) {
  return node.type === 'word' && CSS_COLOR_KEYWORDS.includes(prepareValue(node))
}

function extractColorsFromDeclaration(declaration) {
  const colors = []

  valueParser(declaration.value, {loose: true})
    .parse()
    .walk(node => {
      if (nodeIsHexColor(node) || nodeIsColorFn(node) || nodeIsKeyword(node)) {
        return colors.push(node)
      }
    })

  if (colors.length > 0) {
    declaration.colors = colors.map(color => color.toString().trim())
  }

  return declaration
}

const addCount = color => {
  return {
    ...color,
    count: color.aliases.reduce((acc, curr) => {
      return acc + curr.count
    }, 0)
  }
}

const addShortestNotation = color => {
  return {
    ...color,
    value: [...color.aliases]
      .sort((a, b) => {
        if (a.count === b.count) {
          return a.value.length - b.value.length
        }

        return b.count - a.count
      })
      .shift().value
  }
}

const addAliases = (acc, curr) => {
  if (!acc[curr.normalized]) {
    acc[curr.normalized] = {
      aliases: []
    }
  }

  acc[curr.normalized] = {
    aliases: [...acc[curr.normalized].aliases, curr]
  }

  return acc
}

const filterDuplicateColors = color => {
  // Filter out the actual duplicate colors
  return color.aliases.length > 1
}

const validateColor = color => {
  return tinycolor(color.value).isValid()
}

const normalizeColors = color => {
  // Add a normalized value

  // Avoid using TinyColor's toHslString() because it rounds
  // the numbers and incorrectly reports aliases
  const {h, s, l, a} = tinycolor(color.value).toHsl()
  const normalized = a === 0 ? 0 : `h${h}s${s}l${l}a${a}`

  return {
    ...color,
    normalized
  }
}

const rmTmpProps = color => {
  // Remove temporary props that were needed for analysis
  return {
    ...color,
    aliases: color.aliases.map(alias => {
      const {normalized, ...restAlias} = alias
      return restAlias
    })
  }
}

const withAliases = colors =>
  Object.values(
    colors
      .filter(validateColor)
      .map(normalizeColors)
      .reduce(addAliases, {})
  )
    .filter(filterDuplicateColors)
    .map(addCount)
    .map(addShortestNotation) // @TODO: use most often appearing color here
    .map(rmTmpProps)

module.exports = declarations => {
  const all = declarations
    .map(extractColorsFromDeclaration)
    .filter(declaration => declaration.colors && declaration.colors.length > 0)
    .map(declaration => declaration.colors)
    .reduce((allColors, declarationColors) => {
      return [...allColors, ...declarationColors]
    }, [])
  const {totalUnique, unique} = uniquer(all, colorSorter.sortFn)

  return {
    total: all.length,
    unique,
    totalUnique,
    duplicates: withAliases(unique)
  }
}
