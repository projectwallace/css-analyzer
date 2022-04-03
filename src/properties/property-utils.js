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
    || code === 95 // _
    || code === 43 // +
    || code === 42 // *
    || code === 38 // &
    || code === 36 // $
    || code === 35 // #
}

export function isCustom(property) {
  if (property.length < 3) return false
  // 45 === '-'.charCodeAt(0)
  return property.charCodeAt(0) === 45 && property.charCodeAt(1) === 45
}

export function isProperty(basename, property) {
  if (isCustom(property)) return false
  return endsWith(basename, property)
}