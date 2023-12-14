import { hasVendorPrefix } from '../vendor-prefix.js'
import { Func, Identifier } from '../css-tree-node-types.js'

/**
 * @param {import('css-tree').Value} node
 */
export function isValuePrefixed(node) {
  let children = node.children

  if (!children) {
    return false
  }

  let list = children.toArray()

  for (let index = 0; index < list.length; index++) {
    let node = list[index]
    let { type, name } = node;

    if (type === Identifier && hasVendorPrefix(name)) {
      return true
    }

    if (type === Func) {
      if (hasVendorPrefix(name)) {
        return true
      }

      if (isValuePrefixed(node)) {
        return true
      }
    }
  }

  return false
}
