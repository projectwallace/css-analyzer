import { CountableCollection } from '../countable-collection.js'
import { hasVendorPrefix } from '../vendor-prefix.js'

function isAstVendorPrefixed(children) {
  children = children.toArray()

  for (let index = 0; index < children.length; index++) {
    const child = children[index];

    if (child.type === 'Identifier' && child.name.length >= 3) {
      if (hasVendorPrefix(child.name)) {
        return true
      }
    }

    if (child.type === 'Function') {
      if (hasVendorPrefix(child.name)) {
        return true
      }

      if (child.children && isAstVendorPrefixed(child.children)) {
        return true
      }
    }
  }
  return false
}

const analyzeVendorPrefixes = ({ values, stringifyNode }) => {
  const all = new CountableCollection()

  for (let i = 0; i < values.length; i++) {
    /** @type {import('css-tree').Value} */
    const value = values[i]

    if (value.children && isAstVendorPrefixed(value.children)) {
      all.push(stringifyNode(value))
    }
  }

  return all.count()
}

export {
  analyzeVendorPrefixes
}