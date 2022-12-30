import walk from 'css-tree/walker'

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

const keywordDisallowList = new Set([
  // font-weight, font-stretch, font-style
  'normal',

  // font-size keywords
  'xx-small',
  'x-small',
  'small',
  'medium',
  'large',
  'x-large',
  'xx-large',
  'larger',
  'smaller',

  // font-weight keywords
  'bold',
  'bolder',
  'lighter',

  // font-stretch keywords
  'ultra-condensed',
  'extra-condensed',
  'condensed',
  'semi-condensed',
  'semi-expanded',
  'expanded',
  'extra-expanded',
  'ultra-expanded',

  // font-style keywords
  'italic',
  'oblique',
])

const COMMA = 44 // ','.charCodeAt(0) === 44

export function isFontFamilyKeyword(node) {
  const firstChild = node.children.first
  return firstChild.type === 'Identifier' && systemKeywords.has(firstChild.name)
}

export function getFamilyFromFont(node, stringifyNode) {
  let parts = ''

  walk(node, {
    reverse: true,
    enter: function (fontNode) {
      if (fontNode.type === 'String') {
        const offset = fontNode.loc.start.offset
        // Stringify the first character to get the correct quote character
        const quote = stringifyNode({
          loc: {
            start: { offset },
            end: { offset: offset + 1 }
          }
        })
        return parts = quote + fontNode.value + quote + parts
      }
      if (fontNode.type === 'Operator' && fontNode.value.charCodeAt(0) === COMMA) {
        return parts = fontNode.value + parts
      }
      if (fontNode.type === 'Identifier') {
        if (keywordDisallowList.has(fontNode.name)) {
          return this.skip
        }
        return parts = fontNode.name + parts
      }
    }
  })

  return parts
}
