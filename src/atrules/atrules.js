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
    } else if (node.type === MediaFeature) {
      if (value !== null && value.unit === '\\0') {
        returnValue = true
        return this.break
      }
      else if ('-moz-images-in-menus' === name
        || 'min--moz-device-pixel-ratio' === name
        || '-ms-high-contrast' === name
      ) {
        returnValue = true
        return this.break
      }
      else if ('min-resolution' === name
        && '.001' === value.value
        && 'dpcm' === value.unit
      ) {
        returnValue = true
        return this.break
      }
      else if ('-webkit-min-device-pixel-ratio' === name) {
        let val = value.value
        if ('0' === val || '10000' === val) {
          returnValue = true
          return this.break
        }
      }
    }
  })

  return returnValue
}