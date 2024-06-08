import { hasVendorPrefix } from '../vendor-prefix.js'
import { endsWith } from '../string-utils.js'

/**
 * @param {string} property
 * @see https://github.com/csstree/csstree/blob/master/lib/utils/names.js#L69
 */
export function isHack(property) {
  if (isCustom(property) || hasVendorPrefix(property)) return false

  let code = property.charCodeAt(0)

  return code === 47 // /
    || code === 42 // *
    || code === 95 // _
    || code === 43 // +
    || code === 38 // &
    || code === 36 // $
    || code === 35 // #
}

export function isCustom(property) {
  if (property.length < 3) return false
  // 45 === '-'.charCodeAt(0)
  return property.charCodeAt(0) === 45 && property.charCodeAt(1) === 45
}

/**
 * A check to verify that a propery is `basename` or a prefixed
 * version of that, but never a custom property that accidentally
 * ends with the same substring.
 *
 * @example
 * isProperty('animation', 'animation') // true
 * isProperty('animation', '-webkit-animation') // true
 * isProperty('animation', '--my-animation') // false
 *
 * @param {string} basename
 * @param {string} property
 * @returns {boolean} True if `property` equals `basename` without prefix
 */
export function isProperty(basename, property) {
  if (isCustom(property)) return false
  return endsWith(basename, property)
}

/**
 * Get the basename for a property with a vendor prefix
 * @param {string} property
 * @returns {string} The property name without vendor prefix
 */
export function basename(property) {
  if (hasVendorPrefix(property)) {
    return property.slice(property.indexOf('-', 2) + 1)
  }
  return property
}
