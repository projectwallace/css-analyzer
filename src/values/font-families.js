const systemKeywords = new Set([
  // Global CSS keywords
  'inherit',
  'initial',
  'unset',
  'revert',

  // System font keywords
  'caption',
  'icon',
  'menu',
  'message-box',
  'small-caption',
  'status-bar',
])

export function isFontFamilyKeyword(node) {
  const firstChild = node.children.first
  return firstChild.type === 'Identifier' && systemKeywords.has(firstChild.name)
}
