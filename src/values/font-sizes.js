import walk from 'css-tree/walker'

const sizeKeywords = new Set([
  'xx-small',
  'x-small',
  'small',
  'medium',
  'large',
  'x-large',
  'xx-large',
  'larger',
  'smaller',
])

const keywords = new Set([
  // Global CSS keywords
  'inherit',
  'initial',
  'unset',
  'revert',

  // System font keywords
  'caption',
  'icon',
  'menu',
  'message-box',
  'small-caption',
  'status-bar',
])

const ZERO = 48 // '0'.charCodeAt(0) === 48
const SLASH = 47 // '/'.charCodeAt(0) === 47

export function isFontSizeKeyword(node) {
  const firstChild = node.children.first
  return firstChild.type === 'Identifier' && keywords.has(firstChild.name)
}

export function getSizeFromFont(node) {
  let operator = false
  let size

  walk(node, function (fontNode) {
    switch (fontNode.type) {
      case 'Number': {
        // Special case for `font: 0/0 a`
        if (fontNode.value.charCodeAt(0) === ZERO) {
          size = '0'
          return this.break
        }
      }
      case 'Operator': {
        if (fontNode.value.charCodeAt(0) === SLASH) {
          operator = true
        }
        break
      }
      case 'Dimension': {
        if (!operator) {
          size = fontNode.value + fontNode.unit
          return this.break
        }
      }
      case 'Identifier': {
        if (sizeKeywords.has(fontNode.name)) {
          size = fontNode.name
          return this.break
        }
      }
    }
  })

  return size
}
