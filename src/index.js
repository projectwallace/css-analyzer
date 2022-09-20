import parse from 'css-tree/parser'
import walk from 'css-tree/walker'
import { isSupportsBrowserhack, isMediaBrowserhack } from './atrules/atrules.js'
import { analyzeSpecificity, compareSpecificity } from './selectors/specificity.js'
import { colorFunctions, colorNames } from './values/colors.js'
import { isFontFamilyKeyword, getFamilyFromFont } from './values/font-families.js'
import { isFontSizeKeyword, getSizeFromFont } from './values/font-sizes.js'
import { isValueKeyword } from './values/values.js'
import { analyzeAnimation } from './values/animations.js'
import { isAstVendorPrefixed } from './values/vendor-prefix.js'
import { ContextCollection } from './context-collection.js'
import { CountableCollection } from './countable-collection.js'
import { AggregateCollection } from './aggregate-collection.js'
import { strEquals, startsWith, endsWith } from './string-utils.js'
import { hasVendorPrefix } from './vendor-prefix.js'
import { isCustom, isHack, isProperty } from './properties/property-utils.js'
import { OccurrenceCounter } from './occurrence-counter.js'

/**
 * Analyze CSS
 * @param {string} css
 */
const analyze = (css) => {
  const start = Date.now()

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

  // Stylesheet
  let totalComments = 0
  let commentsSize = 0
  const embeds = new CountableCollection()

  const startParse = Date.now()

  const ast = parse(css, {
    parseCustomProperty: true, // To find font-families, colors, etc.
    positions: true, // So we can use stringifyNode()
    onComment: function (comment) {
      totalComments++
      commentsSize += comment.length
    },
  })

  const startAnalysis = Date.now()

  // Atrules
  let totalAtRules = 0
  /** @type {string}[]} */
  const fontfaces = []
  const layers = new CountableCollection()
  const imports = new CountableCollection()
  const medias = new CountableCollection()
  const mediaBrowserhacks = new CountableCollection()
  const charsets = new CountableCollection()
  const supports = new CountableCollection()
  const supportsBrowserhacks = new CountableCollection()
  const keyframes = new CountableCollection()
  const prefixedKeyframes = new CountableCollection()
  const containers = new CountableCollection()

  // Rules
  let totalRules = 0
  let emptyRules = 0
  const ruleSizes = new AggregateCollection()
  const selectorsPerRule = new AggregateCollection()
  const declarationsPerRule = new AggregateCollection()

  // Selectors
  const keyframeSelectors = new CountableCollection()
  const uniqueSelectors = new OccurrenceCounter()
  /** @type [number,number,number] */
  let maxSpecificity
  /** @type [number,number,number] */
  let minSpecificity
  const specificityA = new AggregateCollection()
  const specificityB = new AggregateCollection()
  const specificityC = new AggregateCollection()
  const uniqueSpecificities = new CountableCollection()
  const selectorComplexities = new AggregateCollection()
  /** @type [number,number,number][] */
  const specificities = []
  const ids = new CountableCollection()
  const a11y = new CountableCollection()

  // Declarations
  const uniqueDeclarations = new OccurrenceCounter()
  let totalDeclarations = 0
  let importantDeclarations = 0
  let importantsInKeyframes = 0

  // Properties
  const properties = new CountableCollection()
  const propertyHacks = new CountableCollection()
  const propertyVendorPrefixes = new CountableCollection()
  const customProperties = new CountableCollection()
  const propertyComplexities = new AggregateCollection()

  // Values
  const vendorPrefixedValues = new CountableCollection()
  const valueBrowserhacks = new CountableCollection()
  const zindex = new CountableCollection()
  const textShadows = new CountableCollection()
  const boxShadows = new CountableCollection()
  const fontFamilies = new CountableCollection()
  const fontSizes = new CountableCollection()
  const timingFunctions = new CountableCollection()
  const durations = new CountableCollection()
  const colors = new ContextCollection()
  const units = new ContextCollection()

  walk(ast, function (node) {
    switch (node.type) {
      case 'Atrule': {
        totalAtRules++
        const atRuleName = node.name

        if (atRuleName === 'font-face') {
          /** @type {[index: string]: string} */
          const descriptors = {}

          node.block.children.forEach(
            /** @param {import('css-tree').Declaration} descriptor */
            descriptor => (descriptors[descriptor.property] = stringifyNode(descriptor.value))
          )

          fontfaces.push(descriptors)
          break
        }

        if (atRuleName === 'media') {
          const prelude = stringifyNode(node.prelude)
          medias.push(prelude)
          if (isMediaBrowserhack(node.prelude)) {
            mediaBrowserhacks.push(prelude)
          }
          break
        }
        if (atRuleName === 'supports') {
          const prelude = stringifyNode(node.prelude)
          supports.push(prelude)
          if (isSupportsBrowserhack(node.prelude)) {
            supportsBrowserhacks.push(prelude)
          }
          break
        }
        if (endsWith('keyframes', atRuleName)) {
          const name = '@' + atRuleName + ' ' + stringifyNode(node.prelude)
          if (hasVendorPrefix(atRuleName)) {
            prefixedKeyframes.push(name)
          }
          keyframes.push(name)
          break
        }
        if (atRuleName === 'import') {
          imports.push(stringifyNode(node.prelude))
          break
        }
        if (atRuleName === 'charset') {
          charsets.push(stringifyNode(node.prelude))
          break
        }
        if (atRuleName === 'container') {
          containers.push(stringifyNode(node.prelude))
          break
        }
        if (atRuleName === 'layer') {
          const prelude = stringifyNode(node.prelude)
          prelude.trim()
            .split(',')
            .map(name => name.trim())
            .forEach(name => layers.push(name))
        }
        break
      }
      case 'Rule': {
        const numSelectors = node.prelude.children ? node.prelude.children.size : 0
        const numDeclarations = node.block.children ? node.block.children.size : 0

        ruleSizes.push(numSelectors + numDeclarations)
        selectorsPerRule.push(numSelectors)
        declarationsPerRule.push(numDeclarations)

        totalRules++

        if (numDeclarations === 0) {
          emptyRules++
        }
        break
      }
      case 'Selector': {
        const selector = stringifyNode(node)

        if (this.atrule && endsWith('keyframes', this.atrule.name)) {
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

        uniqueSelectors.push(selector)
        selectorComplexities.push(complexity)
        uniqueSpecificities.push(specificity)

        if (maxSpecificity === undefined) {
          maxSpecificity = specificity
        }

        if (minSpecificity === undefined) {
          minSpecificity = specificity
        }

        specificityA.push(specificity[0])
        specificityB.push(specificity[1])
        specificityC.push(specificity[2])

        if (minSpecificity !== undefined && compareSpecificity(minSpecificity, specificity) < 0) {
          minSpecificity = specificity
        }

        if (maxSpecificity !== undefined && compareSpecificity(maxSpecificity, specificity) > 0) {
          maxSpecificity = specificity
        }

        specificities.push(specificity)

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
        if (startsWith('data:', node.value)) {
          embeds.push(node.value)
        }
        break
      }
      case 'Value': {
        if (isValueKeyword(node)) {
          break
        }

        const declaration = this.declaration
        const { property, important } = declaration

        if (isAstVendorPrefixed(node)) {
          vendorPrefixedValues.push(stringifyNode(node))
        }

        // i.e. `property: value !ie`
        if (typeof important === 'string') {
          valueBrowserhacks.push(stringifyNode(node) + '!' + important)
        }

        // i.e. `property: value\9`
        if (node.children
          && node.children.last
          && node.children.last.type === 'Identifier'
          && endsWith('\\9', node.children.last.name)
        ) {
          valueBrowserhacks.push(stringifyNode(node))
        }

        // Process properties first that don't have colors,
        // so we can avoid further walking them;
        if (isProperty('z-index', property)) {
          if (!isValueKeyword(node)) {
            zindex.push(stringifyNode(node))
          }
          return this.skip
        } else if (isProperty('font', property)) {
          if (!isFontFamilyKeyword(node)) {
            fontFamilies.push(getFamilyFromFont(node, stringifyNode))
          }
          if (!isFontSizeKeyword(node)) {
            const size = getSizeFromFont(node)
            if (size) {
              fontSizes.push(size)
            }
          }
          break
        } else if (isProperty('font-size', property)) {
          if (!isFontSizeKeyword(node)) {
            fontSizes.push(stringifyNode(node))
          }
          break
        } else if (isProperty('font-family', property)) {
          if (!isFontFamilyKeyword(node)) {
            fontFamilies.push(stringifyNode(node))
          }
          break
        } else if (isProperty('transition', property) || isProperty('animation', property)) {
          const [times, fns] = analyzeAnimation(node.children, stringifyNode)
          for (let i = 0; i < times.length; i++) {
            durations.push(times[i])
          }
          for (let i = 0; i < fns.length; i++) {
            timingFunctions.push(fns[i])
          }
          break
        } else if (isProperty('animation-duration', property) || isProperty('transition-duration', property)) {
          durations.push(stringifyNode(node))
          break
        } else if (isProperty('transition-timing-function', property) || isProperty('animation-timing-function', property)) {
          timingFunctions.push(stringifyNode(node))
          break
        } else if (isProperty('text-shadow', property)) {
          if (!isValueKeyword(node)) {
            textShadows.push(stringifyNode(node))
          }
          // no break here: potentially contains colors
        } else if (isProperty('box-shadow', property)) {
          if (!isValueKeyword(node)) {
            boxShadows.push(stringifyNode(node))
          }
          // no break here: potentially contains colors
        }

        walk(node, function (valueNode) {
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
              // Don't walk var() multiple times
              if (strEquals('var', valueNode.name)) {
                return this.skip
              }
              if (colorFunctions[valueNode.name.toLowerCase()]) {
                colors.push(stringifyNode(valueNode), property)
              }
              // No this.skip here intentionally,
              // otherwise we'll miss colors in linear-gradient() etc.
            }
          }
        })
        break
      }
      case 'Declaration': {
        // Do not process Declarations in atRule preludes
        // because we will handle them manually
        if (this.atrulePrelude !== null) {
          return this.skip
        }

        totalDeclarations++

        const declaration = stringifyNode(node)
        uniqueDeclarations.push(declaration)

        if (node.important === true) {
          importantDeclarations++

          if (this.atrule && endsWith('keyframes', this.atrule.name)) {
            importantsInKeyframes++
          }
        }

        const { property } = node

        properties.push(property)

        if (hasVendorPrefix(property)) {
          propertyVendorPrefixes.push(property)
          propertyComplexities.push(2)
        } else if (isHack(property)) {
          propertyHacks.push(property)
          propertyComplexities.push(2)
        } else if (isCustom(property)) {
          customProperties.push(property)
          propertyComplexities.push(2)
        } else {
          propertyComplexities.push(1)
        }
        break
      }
    }
  })

  const embeddedContent = embeds.count()
  const embedSize = Object.keys(embeddedContent.unique).join('').length

  const totalUniqueDeclarations = uniqueDeclarations.count()

  const totalSelectors = selectorComplexities.size()
  const specificitiesA = specificityA.aggregate()
  const specificitiesB = specificityB.aggregate()
  const specificitiesC = specificityC.aggregate()
  const uniqueSpecificitiesCount = uniqueSpecificities.count()
  const complexityCount = new CountableCollection(selectorComplexities.toArray()).count()
  const totalUniqueSelectors = uniqueSelectors.count()
  const uniqueRuleSize = new CountableCollection(ruleSizes.toArray()).count()
  const uniqueSelectorsPerRule = new CountableCollection(selectorsPerRule.toArray()).count()
  const uniqueDeclarationsPerRule = new CountableCollection(declarationsPerRule.toArray()).count()
  const assign = Object.assign

  return {
    stylesheet: {
      sourceLinesOfCode: totalAtRules + totalSelectors + totalDeclarations + keyframeSelectors.size(),
      linesOfCode: lines.length,
      size: css.length,
      comments: {
        total: totalComments,
        size: commentsSize,
      },
      embeddedContent: assign(embeddedContent, {
        size: {
          total: embedSize,
          ratio: css.length === 0 ? 0 : embedSize / css.length,
        },
      }),
    },
    atrules: {
      fontface: {
        total: fontfaces.length,
        totalUnique: fontfaces.length,
        unique: fontfaces,
        uniquenessRatio: fontfaces.length === 0 ? 0 : 1
      },
      import: imports.count(),
      media: assign(
        medias.count(),
        {
          browserhacks: mediaBrowserhacks.count(),
        }
      ),
      charset: charsets.count(),
      supports: assign(
        supports.count(),
        {
          browserhacks: supportsBrowserhacks.count(),
        },
      ),
      keyframes: assign(
        keyframes.count(), {
        prefixed: assign(
          prefixedKeyframes.count(), {
          ratio: keyframes.size() === 0 ? 0 : prefixedKeyframes.size() / keyframes.size()
        }),
      }),
      container: containers.count(),
      layer: layers.count(),
    },
    rules: {
      total: totalRules,
      empty: {
        total: emptyRules,
        ratio: totalRules === 0 ? 0 : emptyRules / totalRules
      },
      sizes: assign(
        ruleSizes.aggregate(),
        {
          items: ruleSizes.toArray(),
          unique: uniqueRuleSize.unique,
          totalUnique: uniqueRuleSize.totalUnique,
          uniquenessRatio: uniqueRuleSize.uniquenessRatio
        },
      ),
      selectors: assign(
        selectorsPerRule.aggregate(),
        {
          items: selectorsPerRule.toArray(),
          unique: uniqueSelectorsPerRule.unique,
          totalUnique: uniqueSelectorsPerRule.totalUnique,
          uniquenessRatio: uniqueSelectorsPerRule.uniquenessRatio
        },
      ),
      declarations: assign(
        declarationsPerRule.aggregate(),
        {
          items: declarationsPerRule.toArray(),
          unique: uniqueDeclarationsPerRule.unique,
          totalUnique: uniqueDeclarationsPerRule.totalUnique,
          uniquenessRatio: uniqueDeclarationsPerRule.uniquenessRatio,
        },
      ),
    },
    selectors: {
      total: totalSelectors,
      totalUnique: totalUniqueSelectors,
      uniquenessRatio: totalSelectors === 0 ? 0 : totalUniqueSelectors / totalSelectors,
      specificity: {
        min: minSpecificity === undefined ? [0, 0, 0] : minSpecificity,
        max: maxSpecificity === undefined ? [0, 0, 0] : maxSpecificity,
        sum: [specificitiesA.sum, specificitiesB.sum, specificitiesC.sum],
        mean: [specificitiesA.mean, specificitiesB.mean, specificitiesC.mean],
        mode: [specificitiesA.mode, specificitiesB.mode, specificitiesC.mode],
        median: [specificitiesA.median, specificitiesB.median, specificitiesC.median],
        items: specificities,
        unique: uniqueSpecificitiesCount.unique,
        totalUnique: uniqueSpecificitiesCount.totalUnique,
        uniquenessRatio: uniqueSpecificitiesCount.uniquenessRatio,
      },
      complexity: assign(
        selectorComplexities.aggregate(),
        complexityCount, {
        items: selectorComplexities.toArray(),
      }),
      id: assign(
        ids.count(), {
        ratio: totalSelectors === 0 ? 0 : ids.size() / totalSelectors,
      }),
      accessibility: assign(
        a11y.count(), {
        ratio: totalSelectors === 0 ? 0 : a11y.size() / totalSelectors,
      }),
      keyframes: keyframeSelectors.count(),
    },
    declarations: {
      total: totalDeclarations,
      totalUnique: totalUniqueDeclarations,
      uniquenessRatio: totalDeclarations === 0 ? 0 : totalUniqueDeclarations / totalDeclarations,
      // @TODO: deprecated, remove in next major version
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
    properties: assign(
      properties.count(), {
      prefixed: assign(
        propertyVendorPrefixes.count(), {
        ratio: properties.size() === 0 ? 0 : propertyVendorPrefixes.size() / properties.size(),
      }),
      custom: assign(
        customProperties.count(), {
        ratio: properties.size() === 0 ? 0 : customProperties.size() / properties.size(),
      }),
      browserhacks: assign(
        propertyHacks.count(), {
        ratio: properties.size() === 0 ? 0 : propertyHacks.size() / properties.size(),
      }),
      complexity: propertyComplexities.aggregate(),
    }),
    values: {
      colors: colors.count(),
      fontFamilies: fontFamilies.count(),
      fontSizes: fontSizes.count(),
      zindexes: zindex.count(),
      textShadows: textShadows.count(),
      boxShadows: boxShadows.count(),
      animations: {
        durations: durations.count(),
        timingFunctions: timingFunctions.count(),
      },
      prefixes: vendorPrefixedValues.count(),
      browserhacks: valueBrowserhacks.count(),
      units: units.count(),
    },
    __meta__: {
      parseTime: startAnalysis - startParse,
      analyzeTime: Date.now() - startAnalysis,
      total: Date.now() - start
    }
  }
}

export {
  analyze,
  compareSpecificity,
}
