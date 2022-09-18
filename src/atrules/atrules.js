import { strEquals } from '../string-utils.js'
import walk from 'css-tree/walker'

/**
 *
 * @param {*} declarationNode
 * @param {string} property - The CSS property to compare with (case-insensitive)
 * @param {string} value - The identifier/keyword value to compare with
 * @returns true if declaratioNode is the given property: value, false otherwise
 */
function isPropertyValue(declarationNode, property, value) {
  return strEquals(property, declarationNode.property)
    && declarationNode.value.children.first.type === 'Identifier'
    && strEquals(value, declarationNode.value.children.first.name)
}

export function isSupportsBrowserhack(prelude) {
  if (prelude.children.first.type !== 'Parentheses') {
    return false
  }

  let returnValue = false

  walk(prelude, function (declarationNode) {
    if (declarationNode.type === 'Declaration') {
      if (
        isPropertyValue(declarationNode, '-webkit-appearance', 'none')
        || isPropertyValue(declarationNode, '-moz-appearance', 'meterbar')
      ) {
        returnValue = true
        return this.break
      }
    }
  })

  return returnValue
}