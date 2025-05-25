import { strEquals, startsWith, endsWith } from '../string-utils.js'
import walk from 'css-tree/walker'
import {
  Identifier,
  MediaQuery,
  MediaFeature,
  Declaration,
} from '../css-tree-node-types.js'

/**
 * Check whether node.property === property and node.value === value,
 * but case-insensitive and fast.
 * @param {import('css-tree').Declaration} node
 * @param {string} property - The CSS property to compare with (case-insensitive)
 * @param {string} value - The identifier/keyword value to compare with
 * @returns true if declaratioNode is the given property: value, false otherwise
 */
function isPropertyValue(node, property, value) {
  let firstChild = node.value.children.first
  return strEquals(property, node.property)
    && firstChild.type === Identifier
    && strEquals(value, firstChild.name)
}

/**
 * Check if an @supports atRule is a browserhack
 * @param {import('css-tree').AtrulePrelude} prelude
 * @returns true if the atrule is a browserhack
 */
export function isSupportsBrowserhack(prelude) {
  let returnValue = false

  walk(prelude, function (node) {
    if (node.type === Declaration) {
      if (
        isPropertyValue(node, '-webkit-appearance', 'none')
        || isPropertyValue(node, '-moz-appearance', 'meterbar')
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
 * @param {import('css-tree').AtrulePrelude} prelude
 * @returns true if the atrule is a browserhack
 */
export function isMediaBrowserhack(prelude) {
  let returnValue = false

  walk(prelude, function (node) {
    let name = node.name
    let value = node.value

    if (node.type === MediaQuery && node.mediaType !== null) {
      // Note: CSSTree adds a trailing space to \\9
      if (startsWith('\\0', node.mediaType) || endsWith('\\9 ', node.mediaType)) {
        returnValue = true
        return this.break
      }
    } else if (node.type === 'Feature' && node.kind === 'media') {
      if (value && value.unit && value.unit === '\\0') {
        returnValue = true
        return this.break
      }
      else if (strEquals('-moz-images-in-menus', name)
        || strEquals('min--moz-device-pixel-ratio', name)
        || strEquals('-ms-high-contrast', name)
      ) {
        returnValue = true
        return this.break
      }
      else if (strEquals('min-resolution', name)
        && value && strEquals('.001', value.value)
        && strEquals('dpcm', value.unit)
      ) {
        returnValue = true
        return this.break
      }
      else if (strEquals('-webkit-min-device-pixel-ratio', name)) {
        if (value && value.value && (strEquals('0', value.value) || strEquals('10000', value.value))) {
          returnValue = true
          return this.break
        }
      }
    }
  })

  return returnValue
}