import walk from 'css-tree/walker'
import { strEquals, startsWith, endsWith } from '../string-utils.js'
import { hasVendorPrefix } from '../vendor-prefix.js'

export function walkAtRules(ast, stringifyNode, callback) {
  walk(ast, {
    visit: 'Atrule',
    /** @param {import('css-tree').Atrule} node */
    enter: function (node) {
      let name = node.name

      if (strEquals('font-face', name)) {
        let descriptors = {}

        node.block.children.forEach(descriptor => {
          // Ignore 'Raw' nodes in case of CSS syntax errors
          if (descriptor.type === 'Declaration') {
            descriptors[descriptor.property] = stringifyNode(descriptor.value)
          }
        })

        callback({
          node,
          name: 'font-face',
          descriptors
        })
        return this.skip
      }

      if (strEquals('media', name)) {
        callback({
          node,
          name: 'media',
          is_browserhack: isMediaBrowserhack(node.prelude)
        })
        return this.skip
      }

      if (strEquals('supports', name)) {
        callback({
          node,
          name: 'supports',
          is_browserhack: isSupportsBrowserhack(node.prelude)
        })
        return this.skip
      }

      if (endsWith('keyframes', name)) {
        callback({
          node,
          name: 'keyframes',
          full_name: '@' + name + ' ' + stringifyNode(node.prelude),
          has_prefix: hasVendorPrefix(name)
        })
        return this.skip
      }

      if (strEquals('import', name)) {
        callback({
          node,
          name: 'import'
        })
        return this.skip
      }

      if (strEquals('charset', name)) {
        callback({
          node,
          name: 'charset'
        })
        return this.skip
      }

      if (strEquals('container', name)) {
        callback({
          node,
          name: 'container'
        })
        return this.skip
      }

      if (strEquals('layer', name)) {
        callback({
          node,
          name: 'layer',
          layers: stringifyNode(node.prelude)
            .split(',')
            .map(layer => layer.trim())
        })
        return this.skip
      }

      callback({
        node,
        name,
      })
      return this.skip
    }
  })
}

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
function isSupportsBrowserhack(prelude) {
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
function isMediaBrowserhack(prelude) {
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