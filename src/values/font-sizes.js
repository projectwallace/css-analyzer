const keywords = new Set([
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

export function isFontSizeKeyword(node) {
  const firstChild = node.children.first
  return firstChild.type === 'Identifier' && keywords.has(firstChild.name)
}
