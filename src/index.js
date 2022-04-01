import parse from 'css-tree/parser'
import walk from 'css-tree/walker'
import { property as getProperty } from 'css-tree/utils'
import { analyzeRule } from './rules/rules.js'
import { analyzeSpecificity, compareSpecificity } from './selectors/specificity.js'
import { colorFunctions, colorNames } from './values/colors.js'
import { analyzeFontFamilies } from './values/font-families.js'
import { analyzeFontSizes } from './values/font-sizes.js'
import { analyzeValues } from './values/values.js'
import { analyzeAnimations } from './values/animations.js'
import { analyzeVendorPrefixes } from './values/vendor-prefix.js'
import { analyzeAtRules } from './atrules/atrules.js'
import { ContextCollection } from './context-collection.js'
import { CountableCollection } from './countable-collection.js'
import { AggregateCollection } from './aggregate-collection.js'

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
  const embeds = new CountableCollection()
  const atrules = []

  let totalRules = 0
  let emptyRules = 0
  const selectorsPerRule = new AggregateCollection()
  const declarationsPerRule = new AggregateCollection()

  const keyframeSelectors = new CountableCollection()
  const declarationsCache = Object.create(null)
  let totalDeclarations = 0
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

  // SELECTORS
  /** @type number */
  const selectorCounts = Object.create(null)
  /** @type [number,number,number] */
  let maxSpecificity
  /** @type [number,number,number] */
  let minSpecificity
  let specificityA = new AggregateCollection()
  let specificityB = new AggregateCollection()
  let specificityC = new AggregateCollection()
  const complexityAggregator = new AggregateCollection()
  /** @type [number,number,number][] */
  const specificities = []
  /** @type number[] */
  const complexities = []
  const ids = new CountableCollection()
  const a11y = new CountableCollection()

  walk(ast, function (node) {
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
        const [numSelectors, numDeclarations] = analyzeRule(node)

        totalRules++

        if (numDeclarations === 0) {
          emptyRules++
        }

        selectorsPerRule.add(numSelectors)
        declarationsPerRule.add(numDeclarations)
        break
      }
      case 'Selector': {
        const selector = stringifyNode(node)

        if (this.atrule && this.atrule.name.endsWith('keyframes')) {
          keyframeSelectors.push(selector)
          return this.skip
        }

        const { specificity, complexity, isId, isA11y } = analyzeSpecificity(node)

        if (isId) {
          ids.push(selector)
        }

        if (isA11y) {
          a11y.push(selector)
        }

        if (selectorCounts[selector]) {
          selectorCounts[selector]++
        } else {
          selectorCounts[selector] = 1
        }

        complexityAggregator.add(complexity)

        if (maxSpecificity === undefined) {
          maxSpecificity = specificity
        }

        if (minSpecificity === undefined) {
          minSpecificity = specificity
        }

        specificityA.add(specificity[0])
        specificityB.add(specificity[1])
        specificityC.add(specificity[2])

        if (minSpecificity !== undefined && compareSpecificity(minSpecificity, specificity) < 0) {
          minSpecificity = specificity
        }

        if (maxSpecificity !== undefined && compareSpecificity(maxSpecificity, specificity) > 0) {
          maxSpecificity = specificity
        }

        specificities.push(specificity)
        complexities.push(complexity)

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
        totalDeclarations++

        const declaration = stringifyNode(node)
        if (declarationsCache[declaration]) {
          declarationsCache[declaration]++
        } else {
          declarationsCache[declaration] = 1
        }

        if (node.important) {
          importantDeclarations++

          if (this.atrule && this.atrule.name.endsWith('keyframes')) {
            importantsInKeyframes++
          }
        }

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
              colors.push('#' + valueNode.value, property)

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
  })

  const embeddedContent = embeds.count()
  const embedSize = Object.keys(embeddedContent.unique).join('').length

  const totalUniqueDeclarations = Object.keys(declarationsCache).length

  const totalSelectors = complexities.length
  const aggregatesA = specificityA.aggregate()
  const aggregatesB = specificityB.aggregate()
  const aggregatesC = specificityC.aggregate()
  const complexityCount = new CountableCollection(complexities).count()
  const totalUniqueSelectors = Object.values(selectorCounts).length

  return {
    stylesheet: {
      sourceLinesOfCode: atrules.length + totalSelectors + totalDeclarations + keyframeSelectors.size(),
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
    rules: {
      total: totalRules,
      empty: {
        total: emptyRules,
        ratio: totalRules === 0 ? 0 : emptyRules / totalRules
      },
      selectors: {
        ...selectorsPerRule.aggregate(),
        items: selectorsPerRule.toArray(),
      },
      declarations: {
        ...declarationsPerRule.aggregate(),
        items: declarationsPerRule.toArray()
      },
    },
    selectors: {
      total: totalSelectors,
      totalUnique: totalUniqueSelectors,
      uniquenessRatio: totalSelectors === 0 ? 0 : totalUniqueSelectors / totalSelectors,
      specificity: {
        min: minSpecificity === undefined ? [0, 0, 0] : minSpecificity,
        max: maxSpecificity === undefined ? [0, 0, 0] : maxSpecificity,
        sum: [aggregatesA.sum, aggregatesB.sum, aggregatesC.sum],
        mean: [aggregatesA.mean, aggregatesB.mean, aggregatesC.mean],
        mode: [aggregatesA.mode, aggregatesB.mode, aggregatesC.mode],
        median: [aggregatesA.median, aggregatesB.median, aggregatesC.median],
        items: specificities
      },
      complexity: {
        ...complexityAggregator.aggregate(),
        ...complexityCount,
        items: complexities,
      },
      id: {
        ...ids.count(),
        ratio: totalSelectors === 0 ? 0 : ids.size() / totalSelectors,
      },
      accessibility: {
        ...a11y.count(),
        ratio: totalSelectors === 0 ? 0 : a11y.size() / totalSelectors,
      },
      keyframes: keyframeSelectors.count(),
    },
    declarations: {
      total: totalDeclarations,
      unique: {
        total: totalUniqueDeclarations,
        ratio: totalDeclarations === 0 ? 0 : totalUniqueDeclarations / totalDeclarations,
      },
      importants: {
        total: importantDeclarations,
        ratio: totalDeclarations === 0 ? 0 : importantDeclarations / totalDeclarations,
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
