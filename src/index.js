import parse from 'css-tree/parser'
import walk from 'css-tree/walker'
import { property as getProperty } from 'css-tree/utils'
import { compareSpecificity } from './selectors/specificity.js'
import { analyzeRules } from './rules/rules.js'
import { colorFunctions, colorNames } from './values/colors.js'
import { analyzeFontFamilies } from './values/font-families.js'
import { analyzeFontSizes } from './values/font-sizes.js'
import { analyzeDeclarations } from './declarations/declarations.js'
import { analyzeSelectors } from './selectors/selectors.js'
import { analyzeValues } from './values/values.js'
import { analyzeAnimations } from './values/animations.js'
import { analyzeVendorPrefixes } from './values/vendor-prefix.js'
import { analyzeAtRules } from './atrules/atrules.js'
import { ContextCollection } from './context-collection.js'
import { CountableCollection } from './countable-collection.js'

/**
 * Analyze CSS
 * @param {string} css
 */
const analyze = (css) => {
  const start = new Date()

  // We need all lines later on when we need to stringify the AST again
  // e.g. for Selectors
  const lines = css.split(/\r?\n/)

  /**
   * Recreate the authored CSS from a CSSTree node
   * @param {import('css-tree').CssNode} node - Node from CSSTree AST to stringify
   * @returns {string} str - The stringified node
   */
  function stringifyNode(node) {
    const start = node.loc.start
    const end = node.loc.end
    const lineCount = end.line - start.line

    // Single-line nodes
    if (lineCount === 0) {
      return lines[start.line - 1].substring(start.column - 1, end.column - 1)
    }

    // Multi-line nodes
    let value = ''

    for (let i = start.line; i <= end.line; i++) {
      const line = lines[i - 1]
      // First line
      if (i === start.line) {
        value += line.substring(start.column - 1) + '\n'
        continue
      }
      // Last line
      if (i === end.line) {
        value += line.substring(0, end.column - 1)
        continue
      }
      // All lines in between first and last
      value += line + '\n'
    }

    return value
  }

  const startParse = new Date()
  let totalComments = 0
  let commentsSize = 0

  const ast = parse(css, {
    parseAtrulePrelude: false,
    parseCustomProperty: true, // To find font-families, colors, etc.
    positions: true, // So we can use stringifyNode()
    onComment: function (comment) {
      totalComments++
      commentsSize += comment.length
    },
  })

  const startAnalysis = new Date()
  const atrules = []
  const rules = []
  const selectors = []
  const keyframeSelectors = new CountableCollection()
  const declarations = []
  let importantDeclarations = 0
  let importantsInKeyframes = 0
  const properties = new CountableCollection()
  const propertyHacks = new CountableCollection()
  const propertyVendorPrefixes = new CountableCollection()
  const customProperties = new CountableCollection()
  const values = []
  const zindex = []
  const textShadows = []
  const boxShadows = []
  const fontValues = []
  const fontFamilyValues = []
  const fontSizeValues = []
  const animations = []
  const timingFunctions = []
  const durations = []
  const colors = new ContextCollection()
  const units = new ContextCollection()
  const embeds = new CountableCollection()

  walk(ast, {
    enter: function (node) {
      switch (node.type) {
        case 'Atrule': {
          atrules.push({
            name: node.name,
            prelude: node.prelude && node.prelude.value,
            block: node.name === 'font-face' && node.block,
          })
          break
        }
        case 'Rule': {
          rules.push(node)
          break
        }
        case 'Selector': {
          if (this.atrule && this.atrule.name.endsWith('keyframes')) {
            keyframeSelectors.push(stringifyNode(node))
            return this.skip
          }
          selectors.push(node)

          // Avoid deeper walking of selectors to not mess with
          // our specificity calculations in case of a selector
          // with :where() or :is() that contain SelectorLists
          // as children
          return this.skip
        }
        case 'Dimension': {
          if (!this.declaration) {
            break
          }

          units.push(node.unit, this.declaration.property)

          return this.skip
        }
        case 'Url': {
          if (node.value.startsWith('data:')) {
            embeds.push(node.value)
          }
          break
        }
        case 'Declaration': {
          if (node.important) {
            importantDeclarations++

            if (this.atrule && this.atrule.name.endsWith('keyframes')) {
              importantsInKeyframes++
            }
          }

          declarations.push(stringifyNode(node))

          const { value, property } = node
          const fullProperty = getProperty(property)

          properties.push(property)

          if (fullProperty.vendor) {
            propertyVendorPrefixes.push(property)
          }
          if (fullProperty.hack) {
            propertyHacks.push(property)
          }
          if (fullProperty.custom) {
            customProperties.push(property)
          }

          values.push(value)

          switch (fullProperty.basename) {
            case 'z-index': {
              zindex.push(value)
              break
            }
            case 'text-shadow': {
              textShadows.push(value)
              break
            }
            case 'box-shadow': {
              boxShadows.push(value)
              break
            }
            case 'font': {
              fontValues.push(value)
              break
            }
            case 'font-family': {
              fontFamilyValues.push(stringifyNode(value))
              // Prevent analyzer to find color names in this property
              return this.skip
            }
            case 'font-size': {
              fontSizeValues.push(stringifyNode(value))
              break
            }
            case 'transition':
            case 'animation': {
              animations.push(value.children)
              break
            }
            case 'animation-duration':
            case 'transition-duration': {
              durations.push(stringifyNode(value))
              break
            }
            case 'transition-timing-function':
            case 'animation-timing-function': {
              timingFunctions.push(stringifyNode(value))
              break
            }
          }

          walk(value, function (valueNode) {
            switch (valueNode.type) {
              case 'Hash': {
                colors.push(stringifyNode(valueNode), property)

                return this.skip
              }
              case 'Identifier': {
                const { name } = valueNode
                // Bail out if it can't be a color name
                // 20 === 'lightgoldenrodyellow'.length
                // 3 === 'red'.length
                if (name.length > 20 || name.length < 3) {
                  return this.skip
                }
                if (colorNames[name.toLowerCase()]) {
                  colors.push(stringifyNode(valueNode), property)
                }
                return this.skip
              }
              case 'Function': {
                if (colorFunctions[valueNode.name.toLowerCase()]) {
                  colors.push(stringifyNode(valueNode), property)
                }
                // No this.skip here intentionally,
                // otherwise we'll miss colors in linear-gradient() etc.
              }
            }
          })
        }
      }
    }
  })
  const embeddedContent = embeds.count()
  const embedSize = Object.keys(embeddedContent.unique).join('').length

  return {
    stylesheet: {
      sourceLinesOfCode: atrules.length + selectors.length + declarations.length + keyframeSelectors.size(),
      linesOfCode: lines.length,
      size: css.length,
      comments: {
        total: totalComments,
        size: commentsSize,
      },
      embeddedContent: Object.assign(embeddedContent, {
        size: {
          total: embedSize,
          ratio: css.length === 0 ? 0 : embedSize / css.length,
        },
      }),
    },
    atrules: analyzeAtRules({ atrules, stringifyNode }),
    rules: analyzeRules({ rules }),
    selectors: {
      ...analyzeSelectors({ stringifyNode, selectors }),
      keyframes: keyframeSelectors.count(),
    },
    declarations: {
      ...analyzeDeclarations({ declarations }),
      importants: {
        total: importantDeclarations,
        ratio: declarations.length === 0 ? 0 : importantDeclarations / declarations.length,
        inKeyframes: {
          total: importantsInKeyframes,
          ratio: importantDeclarations === 0 ? 0 : importantsInKeyframes / importantDeclarations,
        },
      },
    },
    properties: {
      ...properties.count(),
      prefixed: {
        ...propertyVendorPrefixes.count(),
        ratio: properties.size() === 0 ? 0 : propertyVendorPrefixes.size() / properties.size(),
      },
      custom: {
        ...customProperties.count(),
        ratio: properties.size() === 0 ? 0 : customProperties.size() / properties.size(),
      },
      browserhacks: {
        ...propertyHacks.count(),
        ratio: properties.size() === 0 ? 0 : propertyHacks.size() / properties.size(),
      }
    },
    values: {
      colors: colors.count(),
      fontFamilies: analyzeFontFamilies({ stringifyNode, fontValues, fontFamilyValues }),
      fontSizes: analyzeFontSizes({ stringifyNode, fontValues, fontSizeValues }),
      zindexes: analyzeValues({ values: zindex, stringifyNode }),
      textShadows: analyzeValues({ values: textShadows, stringifyNode }),
      boxShadows: analyzeValues({ values: boxShadows, stringifyNode }),
      animations: analyzeAnimations({ animations, timingFunctions, durations, stringifyNode }),
      prefixes: analyzeVendorPrefixes({ values, stringifyNode }),
      units: units.count(),
    },
    __meta__: {
      parseTime: startAnalysis - startParse,
      analyzeTime: new Date() - startAnalysis,
      total: new Date() - start
    }
  }
}

export {
  analyze,
  compareSpecificity,
}
