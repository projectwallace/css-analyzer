import { strEquals, startsWith, endsWith } from '../string-utils.js'
import walk from 'css-tree/walker'
import {
  is_declaration,
  is_identifier,
  is_media_feature,
  is_media_query
} from '../css-node.js'

/**
 * Check whether node.property === property and node.value === value,
 * but case-insensitive and fast.
 * @param {import('css-tree').Declaration} node
 * @param {string} property - The CSS property to compare with (case-insensitive)
 * @param {string} value - The identifier/keyword value to compare with
 * @returns true if declaratioNode is the given property: value, false otherwise
 */
function isPropertyValue(node, property, value) {
  return strEquals(property, node.property)
    && is_identifier(node.value.children.first.type)
    && strEquals(value, node.value.children.first.name)
}

/**
 * Check if an @supports atRule is a browserhack
 * @param {import('css-tree').AtrulePrelude} prelude
 * @returns true if the atrule is a browserhack
 */
export function isSupportsBrowserhack(prelude) {
  let returnValue = false

  walk(prelude, function (node) {
    if (is_declaration(node.type)) {
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
    if (is_media_query(node.type)
      && node.children.size === 1
      && is_identifier(node.children.first.type)
    ) {
      node = node.children.first
      // Note: CSSTree adds a trailing space to \\9
      if (startsWith('\\0', node.name) || endsWith('\\9 ', node.name)) {
        returnValue = true
        return this.break
      }
    }
    if (is_media_feature(node.type)) {
      if (node.value !== null && node.value.unit === '\\0') {
        returnValue = true
        return this.break
      }
      if (strEquals('-moz-images-in-menus', node.name)
        || strEquals('min--moz-device-pixel-ratio', node.name)
        || strEquals('-ms-high-contrast', node.name)
      ) {
        returnValue = true
        return this.break
      }
      if (strEquals('min-resolution', node.name)
        && strEquals('.001', node.value.value)
        && strEquals('dpcm', node.value.unit)
      ) {
        returnValue = true
        return this.break
      }
      if (strEquals('-webkit-min-device-pixel-ratio', node.name)) {
        if ((strEquals('0', node.value.value) || strEquals('10000', node.value.value))) {
          returnValue = true
          return this.break
        }
      }
    }
  })

  return returnValue
}