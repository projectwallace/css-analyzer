import { strEquals, startsWith, endsWith } from '../string-utils.js'
import walk from 'css-tree/walker'

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
    && node.value.children.first.type === 'Identifier'
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
    if (node.type === 'Declaration') {
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
    if (node.type === 'MediaQuery'
      && node.children.size === 1
      && node.children.first.type === 'Identifier'
    ) {
      node = node.children.first
      // Note: CSSTree adds a trailing space to \\9
      if (startsWith('\\0', node.name) || endsWith('\\9 ', node.name)) {
        returnValue = true
        return this.break
      }
    }
    if (node.type === 'MediaFeature') {
      if (node.value.unit === '\\0') {
        returnValue = true
        return this.break
      }
      if (node.name === '-moz-images-in-menus'
        || node.name === 'min--moz-device-pixel-ratio'
        || node.name === '-ms-high-contrast'
      ) {
        returnValue = true
        return this.break
      }
      if (node.name === 'min-resolution'
        && node.value.value === '.001'
        && node.value.unit === 'dpcm'
      ) {
        returnValue = true
        return this.break
      }
      if (node.name === '-webkit-min-device-pixel-ratio') {
        if ((node.value.value === '0' || node.value.value === '10000')) {
          returnValue = true
          return this.break
        }
      }
    }
  })

  return returnValue
}