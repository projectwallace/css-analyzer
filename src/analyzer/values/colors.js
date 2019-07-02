const {parse} = require('postcss-values-parser')
const tinycolor = require('tinycolor2')
const colorSorter = require('color-sorter')

const uniquer = require('../../utils/uniquer')

function extractColorsFromDeclaration(declaration) {
  const colors = []

  // Try-catch to ignore values that cannot be parsed with postcss-values-parser
  // Examples:
  // - Base64-encoded images
  // - startColorstr=\'#5243AA\', endColorstr=\'#0079bf\', GradientType=1
  // - opacity=50
  // - 1.5deg
  try {
    parse(declaration.value, {loose: true}).walk(node => {
      if (node.isColor) {
        return colors.push(node)
      }
    })
  } catch (error) {}

  if (colors.length > 0) {
    declaration.colors = colors.map(color => color.toString().trim())
  }

  return declaration
}

const addCount = color => {
  return {
    ...color,
    count: color.notations.reduce((total, {count}) => {
      return total + count
    }, 0)
  }
}

const addMostCommonNotation = color => {
  return {
    ...color,
    value: [...color.notations]
      .sort((a, b) => {
        // If counts are the same, get the shortest notation
        if (a.count === b.count) {
          return a.value.length - b.value.length
        }

        return b.count - a.count
      })
      .shift().value
  }
}

const addNotations = (acc, curr) => {
  if (!acc[curr.normalized]) {
    acc[curr.normalized] = {
      notations: []
    }
  }

  acc[curr.normalized] = {
    notations: [...acc[curr.normalized].notations, curr]
  }

  return acc
}

const filterDuplicateColors = color => {
  // Filter out the actual duplicate colors
  return color.notations.length > 1
}

const validateColor = color => {
  return tinycolor(color.value).isValid()
}

const normalizeColors = color => {
  // Add a normalized value

  // Avoid using TinyColor's toHslString() because it rounds
  // the numbers and incorrectly reports duplicates
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
    notations: color.notations.map(notation => {
      const {normalized, ...colorProps} = notation
      return colorProps
    })
  }
}

const withDuplicateNotations = colors =>
  Object.values(
    colors
      .filter(validateColor)
      .map(normalizeColors)
      .reduce(addNotations, {})
  )
    .filter(filterDuplicateColors)
    .map(addCount)
    .map(addMostCommonNotation)
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
  const duplicates = withDuplicateNotations(unique)

  return {
    total: all.length,
    unique,
    totalUnique,
    duplicates: {
      unique: duplicates,
      totalUnique: duplicates.length,
      total: duplicates.length
    }
  }
}
