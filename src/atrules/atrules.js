import { strEquals, startsWith, endsWith } from '../string-utils.js'
// @ts-expect-error CSS Tree types are incomplete
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
  if (node.value.type === 'Raw') return false
  let firstChild = node.value.children.first
  if (firstChild === null) return false
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
    let children = node.children
    let name = node.name
    let value = node.value

    if (node.type === MediaQuery
      && children.size === 1
      && children.first.type === Identifier
    ) {
      let n = children.first.name
      // Note: CSSTree adds a trailing space to \\9
      if (startsWith('\\0', n) || endsWith('\\9 ', n)) {
        returnValue = true
        return this.break
      }
    }
    if (node.type === MediaFeature) {
      if (value !== null && value.unit === '\\0') {
        returnValue = true
        // @ts-expect-error TS doesn't know about CSS Tree's walker breaking
        return this.break
      }
      if (strEquals('-moz-images-in-menus', name)
        || strEquals('min--moz-device-pixel-ratio', name)
        || strEquals('-ms-high-contrast', name)
      ) {
        returnValue = true
        // @ts-expect-error TS doesn't know about CSS Tree's walker breaking
        return this.break
      }
      if (strEquals('min-resolution', name)
        && strEquals('.001', value.value)
        && strEquals('dpcm', value.unit)
      ) {
        returnValue = true
        // @ts-expect-error TS doesn't know about CSS Tree's walker breaking
        return this.break
      }
      if (strEquals('-webkit-min-device-pixel-ratio', name)) {
        let val = value.value
        if ((strEquals('0', val) || strEquals('10000', val))) {
          returnValue = true
          // @ts-expect-error TS doesn't know about CSS Tree's walker breaking
          return this.break
        }
      }
    }
  })

  return returnValue
}