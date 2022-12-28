const keywords = new Set([
  'auto',
  'inherit',
  'initial',
  'unset',
  'revert',
  'none', // for `text-shadow`, `box-shadow` and `background`
])

export function isValueKeyword(node) {
  if (!node.children) return false
  const firstChild = node.children.first
  if (!firstChild) return false

  if (node.children.size > 1) return false
  return firstChild.type === 'Identifier' && keywords.has(firstChild.name)
}
