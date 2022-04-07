import walk from 'css-tree/walker'

const sizeKeywords = {
  'xx-small': 1,
  'x-small': 1,
  'small': 1,
  'medium': 1,
  'large': 1,
  'x-large': 1,
  'xx-large': 1,
  'larger': 1,
  'smaller': 1,
}

const keywords = {
  // Global CSS keywords
  'inherit': 1,
  'initial': 1,
  'unset': 1,
  'revert': 1,

  // System font keywords
  'caption': 1,
  'icon': 1,
  'menu': 1,
  'message-box': 1,
  'small-caption': 1,
  'status-bar': 1,
}

const ZERO = 48 // '0'.charCodeAt(0) === 48
const SLASH = 47 // '/'.charCodeAt(0) === 47

export function isFontSizeKeyword(node) {
  const firstChild = node.children.first
  return firstChild.type === 'Identifier' && keywords[firstChild.name]
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
        if (sizeKeywords[fontNode.name]) {
          size = fontNode.name
          return this.break
        }
      }
    }
  })

  return size
}
