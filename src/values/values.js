import { KeywordSet } from "../keyword-set.js"

const keywords = new KeywordSet([
  'auto',
  'inherit',
  'initial',
  'unset',
  'revert',
  'revert-layer',
  'none', // for `text-shadow`, `box-shadow` and `background`
])

export function isValueKeyword(node) {
  if (!node.children) return false
  if (node.children.size > 1 || node.children.size === 0) return false

  let firstChild = node.children.first
  return firstChild.type === 'Identifier' && keywords.has(firstChild.name)
}
