import { str_equals, starts_with, ends_with } from '../string-utils.js'
import walk from 'css-tree/walker'
import {
  Identifier,
  // MediaQuery,
  // Declaration,
} from '../css-tree-node-types.js'
import type { AtrulePrelude, CssNode, Declaration, Raw } from 'css-tree'

/**
 * Check whether node.property === property and node.value === value,
 * but case-insensitive and fast.
 * @param property - The CSS property to compare with (case-insensitive)
 * @param value - The identifier/keyword value to compare with
 * @returns true if declaratioNode is the given property: value, false otherwise
 */
function is_property_value(node: Declaration, property: string, value: string): boolean {
  if (node.value.type !== 'Value') {
    return false
  }
  let firstChild = node.value.children.first
  return str_equals(property, node.property)
    && firstChild?.type === Identifier
    && str_equals(value, firstChild.name)
}

/**
 * Check if an @supports atRule is a browserhack
 * @returns true if the atrule is a browserhack
 */
export function is_supports_browserhack(prelude: AtrulePrelude | Raw | null): boolean {
  if (prelude === null || prelude.type !== 'AtrulePrelude') {
    return false
  }

  let returnValue = false

  walk(prelude, function (node: CssNode) {
    if (node.type === 'Declaration') {
      if (
        is_property_value(node, '-webkit-appearance', 'none')
        || is_property_value(node, '-moz-appearance', 'meterbar')
      ) {
        returnValue = true
        return this.break
      }
    }
  })

  return returnValue
}

/**
 * Check if a @media atRule is a browserhack
 * @returns true if the atrule is a browserhack
 */
export function is_media_browserhack(prelude: AtrulePrelude | Raw | null): boolean {
  if (prelude === null || prelude.type !== 'AtrulePrelude') {
    return false
  }

  let returnValue = false

  walk(prelude, function (node) {
    let name = node.name
    let value = node.value

    if (node.type === 'MediaQuery' && node.mediaType !== null) {
      // Note: CSSTree adds a trailing space to \\9
      if (starts_with('\\0', node.mediaType) || ends_with('\\9 ', node.mediaType)) {
        returnValue = true
        return this.break
      }
    }
    else if (node.type === 'Feature' && node.kind === 'media') {
      if (value && value.unit && value.unit === '\\0') {
        returnValue = true
        return this.break
      }
      else if (str_equals('-moz-images-in-menus', name)
        || str_equals('min--moz-device-pixel-ratio', name)
        || str_equals('-ms-high-contrast', name)
      ) {
        returnValue = true
        return this.break
      }
      else if (str_equals('min-resolution', name)
        && value && str_equals('.001', value.value)
        && str_equals('dpcm', value.unit)
      ) {
        returnValue = true
        return this.break
      }
      else if (str_equals('-webkit-min-device-pixel-ratio', name)) {
        if (value && value.value && (str_equals('0', value.value) || str_equals('10000', value.value))) {
          returnValue = true
          return this.break
        }
      }
    }
  })

  return returnValue
}