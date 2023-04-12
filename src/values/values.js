import { KeywordSet } from "../keyword-set.js"

const keywords = new KeywordSet([
  'inherit',
  'initial',
  'unset',
  'revert',
  'revert-layer',
])

/** @param {import('css-tree').Value} node */
export function isValueGlobalKeyword(node) {
  if (node.children.size > 1) return false
  let firstChild = node.children.first
  if (!firstChild) return false
  return firstChild.type === 'Identifier' && keywords.has(firstChild.name)
}
