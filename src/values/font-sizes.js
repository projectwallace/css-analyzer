import * as csstree from 'css-tree'
import { CountableCollection } from '../countable-collection.js'

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

const analyzeFontSizes = ({ stringifyNode, fontSizeValues, fontValues }) => {
  const all = new CountableCollection(fontSizeValues)

  for (let index = 0; index < fontValues.length; index++) {
    const fontNode = fontValues[index];
    // Try to eliminate a keyword before we continue
    const firstChild = fontNode.children.first

    if (firstChild.type === 'Identifier' && keywords[firstChild.name]) {
      continue
    }

    let operator = false
    let size

    csstree.walk(fontNode, {
      enter: function (fontNode) {
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
              size = stringifyNode(fontNode)
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
      }
    })

    if (size) {
      all.push(size)
    }
  }

  return all.count()
}

export {
  analyzeFontSizes
}