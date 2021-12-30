import * as csstree from 'css-tree'
import { CountableCollection } from '../countable-collection.js'

const systemKeywords = {
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

const keywordDisallowList = {
  // font-weight, font-stretch, font-style
  'normal': 1,

  // font-size keywords
  'xx-small': 1,
  'x-small': 1,
  'small': 1,
  'medium': 1,
  'large': 1,
  'x-large': 1,
  'xx-large': 1,
  'larger': 1,
  'smaller': 1,

  // font-weight keywords
  'bold': 1,
  'bolder': 1,
  'lighter': 1,

  // font-stretch keywords
  'ultra-condensed': 1,
  'extra-condensed': 1,
  'condensed': 1,
  'semi-condensed': 1,
  'semi-expanded': 1,
  'expanded': 1,
  'extra-expanded': 1,
  'ultra-expanded': 1,

  // font-style keywords
  'italic': 1,
  'oblique': 1,
}

const COMMA = 44 // ','.charCodeAt(0) === 44

const analyzeFontFamilies = ({ fontValues, fontFamilyValues }) => {
  const all = new CountableCollection(fontFamilyValues)

  for (let index = 0; index < fontValues.length; index++) {
    const value = fontValues[index]

    // Avoid tree traversal as soon as possible
    const firstChild = value.children.first

    if (firstChild.type === 'Identifier' && systemKeywords[firstChild.name]) {
      continue
    }

    const parts = []

    csstree.walk(value, {
      reverse: true,
      enter: function (fontNode) {
        if (fontNode.type === 'String') {
          return parts.unshift(fontNode)
        }
        if (fontNode.type === 'Operator' && fontNode.value.charCodeAt(0) === COMMA) {
          return parts.unshift(fontNode)
        }
        if (fontNode.type === 'Identifier') {
          if (keywordDisallowList[fontNode.name]) {
            return this.skip
          }
          return parts.unshift(fontNode)
        }
      }
    })

    all.push(parts.map(csstree.generate).join(''))
  }

  return all.count()
}

export {
  analyzeFontFamilies
}