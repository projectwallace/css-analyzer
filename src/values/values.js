import { KeywordSet } from "../keyword-set.js"
import { Identifier } from "../css-tree-node-types.js"

const keywords = new KeywordSet([
  'auto',
  'inherit',
  'initial',
  'unset',
  'revert',
  'revert-layer',
  'none', // for `text-shadow`, `box-shadow` and `background`
])

/**
 * @param {import('css-tree').Value} node
 */
export function isValueKeyword(node) {
  let children = node.children
  let size = children.size

  if (!children) return false
  if (size > 1 || size === 0) return false

  let firstChild = children.first
  return firstChild.type === Identifier && keywords.has(firstChild.name)
}
