import walk from 'css-tree/walker'
import { KeywordSet } from '../keyword-set.js'
import { endsWith, strEquals } from '../string-utils.js'
import { isProperty } from '../properties/property-utils.js'

const namedColors = new KeywordSet([
  // CSS Named Colors
  // Spec: https://drafts.csswg.org/css-color/#named-colors

  // Heuristic: popular names first for quick finding in set.has()
  'white',
  'black',
  'red',
  'blue',
  'gray',
  'grey',
  'green',
  'rebeccapurple',
  'yellow',
  'orange',

  'aliceblue',
  'antiquewhite',
  'aqua',
  'aquamarine',
  'azure',
  'beige',
  'bisque',
  'blanchedalmond',
  'blueviolet',
  'brown',
  'burlywood',
  'cadetblue',
  'chartreuse',
  'chocolate',
  'coral',
  'cornflowerblue',
  'cornsilk',
  'crimson',
  'cyan',
  'darkblue',
  'darkcyan',
  'darkgoldenrod',
  'darkgray',
  'darkgreen',
  'darkgrey',
  'darkkhaki',
  'darkmagenta',
  'darkolivegreen',
  'darkorange',
  'darkorchid',
  'darkred',
  'darksalmon',
  'darkseagreen',
  'darkslateblue',
  'darkslategray',
  'darkslategrey',
  'darkturquoise',
  'darkviolet',
  'deeppink',
  'deepskyblue',
  'dimgray',
  'dimgrey',
  'dodgerblue',
  'firebrick',
  'floralwhite',
  'forestgreen',
  'fuchsia',
  'gainsboro',
  'ghostwhite',
  'gold',
  'goldenrod',
  'greenyellow',
  'honeydew',
  'hotpink',
  'indianred',
  'indigo',
  'ivory',
  'khaki',
  'lavender',
  'lavenderblush',
  'lawngreen',
  'lemonchiffon',
  'lightblue',
  'lightcoral',
  'lightcyan',
  'lightgoldenrodyellow',
  'lightgray',
  'lightgreen',
  'lightgrey',
  'lightpink',
  'lightsalmon',
  'lightseagreen',
  'lightskyblue',
  'lightslategray',
  'lightslategrey',
  'lightsteelblue',
  'lightyellow',
  'lime',
  'limegreen',
  'linen',
  'magenta',
  'maroon',
  'mediumaquamarine',
  'mediumblue',
  'mediumorchid',
  'mediumpurple',
  'mediumseagreen',
  'mediumslateblue',
  'mediumspringgreen',
  'mediumturquoise',
  'mediumvioletred',
  'midnightblue',
  'mintcream',
  'mistyrose',
  'moccasin',
  'navajowhite',
  'navy',
  'oldlace',
  'olive',
  'olivedrab',
  'orangered',
  'orchid',
  'palegoldenrod',
  'palegreen',
  'paleturquoise',
  'palevioletred',
  'papayawhip',
  'peachpuff',
  'peru',
  'pink',
  'plum',
  'powderblue',
  'purple',
  'rosybrown',
  'royalblue',
  'saddlebrown',
  'salmon',
  'sandybrown',
  'seagreen',
  'seashell',
  'sienna',
  'silver',
  'skyblue',
  'slateblue',
  'slategray',
  'slategrey',
  'snow',
  'springgreen',
  'steelblue',
  'tan',
  'teal',
  'thistle',
  'tomato',
  'turquoise',
  'violet',
  'wheat',
  'whitesmoke',
  'yellowgreen',
])

const systemColors = new KeywordSet([
  // CSS System Colors
  // Spec: https://drafts.csswg.org/css-color/#css-system-colors
  'canvas',
  'canvastext',
  'linktext',
  'visitedtext',
  'activetext',
  'buttonface',
  'buttontext',
  'buttonborder',
  'field',
  'fieldtext',
  'highlight',
  'highlighttext',
  'selecteditem',
  'selecteditemtext',
  'mark',
  'marktext',
  'graytext',

  // TODO: Deprecated CSS System colors
  // Spec: https://drafts.csswg.org/css-color/#deprecated-system-colors
])

const colorFunctions = new KeywordSet([
  'rgb',
  'rgba',
  'hsl',
  'hsla',
  'hwb',
  'lab',
  'lch',
  'oklab',
  'oklch',
  'color',
])

const colorKeywords = new KeywordSet([
  'transparent',
  'currentcolor',
])

/**
 * @typedef Color
 * @property {string} color
 * @property {string} property
 * @property {string} format
 *
 * @callback ColorCb
 * @param {Color} color
 */

/**
 * @param {import('css-tree').CssNode} ast
 * @param {Function} stringifyNode
 * @param {ColorCb} callback
 */
export function walkColors(ast, stringifyNode, callback) {
  walk(ast, {
    visit: 'Declaration',
    /** @param {import('css-tree').Declaration} declaration */
    enter: function (declaration) {
      walk(declaration, function (x_node) {
        if (x_node.type !== 'Value') return

        let property = declaration.property

        // These properties are known to be problematic because they possibly contain color-like names
        if (isProperty('font', property) || isProperty('font-family', property)) {
          return this.skip
        }

        walk(x_node, function (node) {
          if (node.type === 'Hash') {
            let hex_length = node.value.length

            if (endsWith('\\9', node.value)) {
              hex_length = hex_length - 2
            }

            callback({
              color: '#' + node.value,
              property,
              format: 'hex' + hex_length,
            })
            return this.skip
          }

          let name = node.name

          if (node.type === 'Identifier') {
            // Bail out if it can't be a color name
            // 20 === 'lightgoldenrodyellow'.length
            // 3 === 'red'.length
            if (name.length > 20 || name.length < 3) {
              return
            }

            if (namedColors.has(name)) {
              callback({
                color: stringifyNode(node),
                property,
                format: 'named'
              })
              return this.skip
            }

            if (colorKeywords.has(name)) {
              callback({
                color: stringifyNode(node),
                property,
                format: name.toLowerCase()
              })
              return this.skip
            }

            if (systemColors.has(name)) {
              callback({
                color: stringifyNode(node),
                property,
                format: 'system'
              })
              return this.skip
            }

            return this.skip
          }

          if (node.type === 'Function') {
            // Don't walk var() multiple times
            if (strEquals('var', name)) {
              return this.skip
            }

            if (colorFunctions.has(name)) {
              callback({
                color: stringifyNode(node),
                property,
                format: name.toLowerCase()
              })
            }

            // No this.skip here intentionally,
            // otherwise we'll miss colors in linear-gradient() etc.
          }
        })
      })
    }
  })
}