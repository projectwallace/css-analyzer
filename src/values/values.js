import { KeywordSet } from "../keyword-set.js"
import { Identifier } from "../css-tree-node-types.js"

export const keywords = new KeywordSet([
  'auto',
  'none', // for `text-shadow`, `box-shadow` and `background`
  'inherit',
  'initial',
  'unset',
  'revert',
  'revert-layer',
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
