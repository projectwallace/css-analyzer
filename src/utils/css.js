const colorNames = require('css-color-names')

const colorNameDelimiter = '(?![-\'"_.])'

module.exports.KEYWORDS = [
  'auto',
  'inherit',
  'initial',
  'none'
]

module.exports.color = {
  keywords: this.KEYWORDS.concat([
    'currentColor',
    'transparent'
  ]),

  properties: [
    'background-color',
    'border-top-color',
    'border-right-color',
    'border-bottom-color',
    'border-left-color',
    'fill',
    'color'
  ],

  // Source: https://github.com/tiaanduplessis/colors-regex/blob/master/index.js
  regex: {
    name: new RegExp(`${colorNameDelimiter}(${Object.keys(colorNames).join('|')})${colorNameDelimiter}`, 'gi'),
    hex: /#([a-f0-9]{8}|[a-f0-9]{6}|[a-f0-9]{4}|[a-f0-9]{3})\b/gi,
    rgb: /rgba\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3}),\s*(\d*(?:\.\d+)?)\)|rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)/gi,
    hsl: /hsl\(\s*(\d+)\s*,\s*(\d*(?:\.\d+)?%)\s*,\s*(\d*(?:\.\d+)?%)\)|hsla\((\d+),\s*([\d.]+)%,\s*([\d.]+)%,\s*(\d*(?:\.\d+)?)\)/gi
  }
}

module.exports.stripImportant = value => {
  return value
    .toString()
    .replace('!important', '')
    .trim()
}
