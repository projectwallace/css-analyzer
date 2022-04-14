const keywords = {
  'auto': 1,
  'inherit': 1,
  'initial': 1,
  'unset': 1,
  'revert': 1,
  'none': 1, // for `text-shadow`, `box-shadow` and `background`
}

export function isValueKeyword(node) {
  const firstChild = node.children?.first
  if (!firstChild) return false

  if (node.children.size > 1) return false
  return firstChild.type === 'Identifier' && keywords[firstChild.name]
}
