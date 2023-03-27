import { is_identifier } from '../css-node.js'

const keywords = new Set([
  'auto',
  'inherit',
  'initial',
  'unset',
  'revert',
  'none', // for `text-shadow`, `box-shadow` and `background`
])

/** @param {import('css-tree').CssNode} node */
export function isValueKeyword(node) {
  if (!node.children) return false
  const firstChild = node.children.first
  if (!firstChild) return false

  if (node.children.size > 1) return false
  return is_identifier(firstChild.type) && keywords.has(firstChild.name)
}
