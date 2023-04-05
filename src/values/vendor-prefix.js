import { hasVendorPrefix } from '../vendor-prefix.js'

export function isAstVendorPrefixed(node) {
  if (!node.children) {
    return false
  }

  let children = node.children.toArray()

  for (let index = 0; index < children.length; index++) {
    let node = children[index]
    let { type, name } = node;

    if (type === 'Identifier' && hasVendorPrefix(name)) {
      return true
    }

    if (type === 'Function') {
      if (hasVendorPrefix(name)) {
        return true
      }

      if (isAstVendorPrefixed(node)) {
        return true
      }
    }
  }

  return false
}
