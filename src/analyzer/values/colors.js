const valueParser = require('postcss-values-parser')
const cssColorNames = require('css-color-names')

const uniquer = require('../../utils/uniquer')

const CSS_COLOR_KEYWORDS = Object
  .keys(cssColorNames)
  .map(color => color.toLowerCase())
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
  return node.type === 'func' &&
    CSS_COLOR_FUNCTIONS.includes(prepareValue(node.value))
}

function nodeIsKeyword(node) {
  return node.type === 'word' &&
    CSS_COLOR_KEYWORDS.includes(prepareValue(node))
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

module.exports = declarations => {
  const all = declarations
    .map(extractColorsFromDeclaration)
    .filter(declaration => declaration.colors && declaration.colors.length > 0)
    .map(declaration => declaration.colors)
    .reduce((allColors, declarationColors) => {
      return [...allColors, ...declarationColors]
    }, [])

  return {
    total: all.length,
    ...uniquer(all)
  }
}
