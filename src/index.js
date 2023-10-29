import parse from 'css-tree/parser'
import walk from 'css-tree/walker'
import { calculate } from '@bramus/specificity/core'
import { isSupportsBrowserhack, isMediaBrowserhack } from './atrules/atrules.js'
import { getCombinators, getComplexity, isAccessibility } from './selectors/utils.js'
import { colorFunctions, colorKeywords, namedColors, systemColors } from './values/colors.js'
import { destructure, isSystemFont } from './values/destructure-font-shorthand.js'
import { isValueKeyword } from './values/values.js'
import { analyzeAnimation } from './values/animations.js'
import { isAstVendorPrefixed } from './values/vendor-prefix.js'
import { ContextCollection } from './context-collection.js'
import { Collection } from './collection.js'
import { AggregateCollection } from './aggregate-collection.js'
import { strEquals, startsWith, endsWith } from './string-utils.js'
import { hasVendorPrefix } from './vendor-prefix.js'
import { isCustom, isHack, isProperty } from './properties/property-utils.js'
import { getEmbedType } from './stylesheet/stylesheet.js'
import { isIe9Hack } from './values/browserhacks.js'

/** @typedef {[number, number, number]} Specificity */

function ratio(part, total) {
  if (total === 0) return 0
  return part / total
}

let defaults = {
  useUnstableLocations: false
}

/**
 * @typedef Options
 * @property {boolean} useUnstableLocations **WARNING: EXPERIMENTAL!** Use Locations (`{ 'item': [{ line, column, offset, length }] }`) instead of a regular count per occurrence (`{ 'item': 3 }`)
 */

/**
 * Analyze CSS
 * @param {string} css
 * @param {Options} options
 */
export function analyze(css, options = {}) {
  let settings = Object.assign({}, defaults, options)
  let useLocations = settings.useUnstableLocations === true
  let start = Date.now()

  /**
   * Recreate the authored CSS from a CSSTree node
   * @param {import('css-tree').CssNode} node - Node from CSSTree AST to stringify
   * @returns {string} str - The stringified node
   */
  function stringifyNode(node) {
    return stringifyNodePlain(node).trim()
  }

  function stringifyNodePlain(node) {
    return css.substring(node.loc.start.offset, node.loc.end.offset)
  }

  // Stylesheet
  let totalComments = 0
  let commentsSize = 0
  let embeds = new Collection({ useLocations })
  let embedSize = 0
  let embedTypes = {
    total: 0,
    /** @type {Map<string, {size: number, count: number}>} */
    unique: new Map()
  }

  let startParse = Date.now()

  let ast = parse(css, {
    parseCustomProperty: true, // To find font-families, colors, etc.
    positions: true, // So we can use stringifyNode()
    /** @param {string} comment */
    onComment: function (comment) {
      totalComments++
      commentsSize += comment.length
    },
  })

  let startAnalysis = Date.now()
  let linesOfCode = ast.loc.end.line - ast.loc.start.line + 1

  // Atrules
  let totalAtRules = 0
  /** @type {Record<string: string>}[]} */
  let fontfaces = []
  let layers = new Collection({ useLocations })
  let imports = new Collection({ useLocations })
  let medias = new Collection({ useLocations })
  let mediaBrowserhacks = new Collection({ useLocations })
  let charsets = new Collection({ useLocations })
  let supports = new Collection({ useLocations })
  let supportsBrowserhacks = new Collection({ useLocations })
  let keyframes = new Collection({ useLocations })
  let prefixedKeyframes = new Collection({ useLocations })
  let containers = new Collection({ useLocations })
  let registeredProperties = new Collection({ useLocations })

  // Rules
  let totalRules = 0
  let emptyRules = 0
  let ruleSizes = new AggregateCollection()
  let selectorsPerRule = new AggregateCollection()
  let declarationsPerRule = new AggregateCollection()
  let uniqueRuleSize = new Collection({ useLocations })
  let uniqueSelectorsPerRule = new Collection({ useLocations })
  let uniqueDeclarationsPerRule = new Collection({ useLocations })

  // Selectors
  let keyframeSelectors = new Collection({ useLocations })
  let uniqueSelectors = new Set()
  let prefixedSelectors = new Collection({ useLocations })
  /** @type {Specificity} */
  let maxSpecificity
  /** @type {Specificity} */
  let minSpecificity
  let specificityA = new AggregateCollection()
  let specificityB = new AggregateCollection()
  let specificityC = new AggregateCollection()
  let uniqueSpecificities = new Collection({ useLocations })
  let selectorComplexities = new AggregateCollection()
  let uniqueSelectorComplexities = new Collection({ useLocations })
  /** @type {Specificity[]} */
  let specificities = []
  let ids = new Collection({ useLocations })
  let a11y = new Collection({ useLocations })
  let combinators = new Collection({ useLocations })

  // Declarations
  let uniqueDeclarations = new Set()
  let totalDeclarations = 0
  let importantDeclarations = 0
  let importantsInKeyframes = 0
  let importantCustomProperties = new Collection({ useLocations })

  // Properties
  let properties = new Collection({ useLocations })
  let propertyHacks = new Collection({ useLocations })
  let propertyVendorPrefixes = new Collection({ useLocations })
  let customProperties = new Collection({ useLocations })
  let propertyComplexities = new AggregateCollection()

  // Values
  let vendorPrefixedValues = new Collection({ useLocations })
  let valueBrowserhacks = new Collection({ useLocations })
  let zindex = new Collection({ useLocations })
  let textShadows = new Collection({ useLocations })
  let boxShadows = new Collection({ useLocations })
  let fontFamilies = new Collection({ useLocations })
  let fontSizes = new Collection({ useLocations })
  let lineHeights = new Collection({ useLocations })
  let timingFunctions = new Collection({ useLocations })
  let durations = new Collection({ useLocations })
  let colors = new ContextCollection({ useLocations })
  let colorFormats = new Collection({ useLocations })
  let units = new ContextCollection({ useLocations })
  let gradients = new Collection({ useLocations })

  walk(ast, function (node) {
    switch (node.type) {
      case 'Atrule': {
        totalAtRules++
        let atRuleName = node.name

        if (atRuleName === 'font-face') {
          let descriptors = {}

          node.block.children.forEach(descriptor => {
            // Ignore 'Raw' nodes in case of CSS syntax errors
            if (descriptor.type === 'Declaration') {
              descriptors[descriptor.property] = stringifyNode(descriptor.value)
            }
          })

          fontfaces.push(descriptors)
          break
        }

        if (atRuleName === 'media') {
          let prelude = stringifyNode(node.prelude)
          medias.push(prelude, node.prelude.loc)
          if (isMediaBrowserhack(node.prelude)) {
            mediaBrowserhacks.push(prelude, node.prelude.loc)
          }
          break
        }
        if (atRuleName === 'supports') {
          let prelude = stringifyNode(node.prelude)
          supports.push(prelude, node.prelude.loc)
          if (isSupportsBrowserhack(node.prelude)) {
            supportsBrowserhacks.push(prelude, node.prelude.loc)
          }
          break
        }
        if (endsWith('keyframes', atRuleName)) {
          let name = '@' + atRuleName + ' ' + stringifyNode(node.prelude)
          if (hasVendorPrefix(atRuleName)) {
            prefixedKeyframes.push(name, node.prelude.loc)
          }
          keyframes.push(name, node.prelude.loc)
          break
        }
        if (atRuleName === 'import') {
          imports.push(stringifyNode(node.prelude), node.prelude.loc)
          break
        }
        if (atRuleName === 'charset') {
          charsets.push(stringifyNode(node.prelude), node.prelude.loc)
          break
        }
        if (atRuleName === 'container') {
          containers.push(stringifyNode(node.prelude), node.prelude.loc)
          break
        }
        if (atRuleName === 'layer') {
          let prelude = stringifyNode(node.prelude)
          prelude
            .split(',')
            .forEach(name => layers.push(name.trim(), node.prelude.loc))
          break
        }
        if (atRuleName === 'property') {
          let prelude = stringifyNode(node.prelude)
          registeredProperties.push(prelude, node.prelude.loc)
          break
        }
        break
      }
      case 'Rule': {
        let numSelectors = node.prelude.children ? node.prelude.children.size : 0
        let numDeclarations = node.block.children ? node.block.children.size : 0

        ruleSizes.push(numSelectors + numDeclarations)
        uniqueRuleSize.push(numSelectors + numDeclarations, node.loc)
        selectorsPerRule.push(numSelectors)
        uniqueSelectorsPerRule.push(numSelectors, node.prelude.loc)
        declarationsPerRule.push(numDeclarations)
        uniqueDeclarationsPerRule.push(numDeclarations, node.block.loc)

        totalRules++

        if (numDeclarations === 0) {
          emptyRules++
        }
        break
      }
      case 'Selector': {
        let selector = stringifyNode(node)

        if (this.atrule && endsWith('keyframes', this.atrule.name)) {
          keyframeSelectors.push(selector, node.loc)
          return this.skip
        }

        if (isAccessibility(node)) {
          a11y.push(selector, node.loc)
        }

        let [complexity, isPrefixed] = getComplexity(node)

        if (isPrefixed) {
          prefixedSelectors.push(selector, node.loc)
        }

        uniqueSelectors.add(selector)
        selectorComplexities.push(complexity)
        uniqueSelectorComplexities.push(complexity, node.loc)

        // #region specificity
        let [{ value: specificityObj }] = calculate(node)
        let sa = specificityObj.a
        let sb = specificityObj.b
        let sc = specificityObj.c

        /** @type {Specificity} */
        let specificity = [sa, sb, sc]

        uniqueSpecificities.push(sa + ',' + sb + ',' + sc, node.loc)

        specificityA.push(sa)
        specificityB.push(sb)
        specificityC.push(sc)

        if (maxSpecificity === undefined) {
          maxSpecificity = specificity
        }

        if (minSpecificity === undefined) {
          minSpecificity = specificity
        }

        if (minSpecificity !== undefined && compareSpecificity(minSpecificity, specificity) < 0) {
          minSpecificity = specificity
        }

        if (maxSpecificity !== undefined && compareSpecificity(maxSpecificity, specificity) > 0) {
          maxSpecificity = specificity
        }

        specificities.push(specificity)
        // #endregion

        if (sa > 0) {
          ids.push(selector, node.loc)
        }

        getCombinators(node, function onCombinator(combinator) {
          combinators.push(combinator.name, combinator.loc)
        })

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

        /** @type {string} */
        let unit = node.unit

        if (endsWith('\\9', unit)) {
          units.push(unit.substring(0, unit.length - 2), this.declaration.property, node.loc)
        } else {
          units.push(unit, this.declaration.property, node.loc)
        }

        return this.skip
      }
      case 'Url': {
        if (startsWith('data:', node.value)) {
          let embed = node.value
          let size = embed.length
          let type = getEmbedType(embed)

          embedTypes.total++
          embedSize += size

          if (embedTypes.unique.has(type)) {
            let item = embedTypes.unique.get(type)
            item.count++
            item.size += size
            embedTypes.unique.set(type, item)
          } else {
            embedTypes.unique.set(type, {
              count: 1,
              size
            })
          }

          // @deprecated
          embeds.push(embed, node.loc)
        }
        break
      }
      case 'Value': {
        if (isValueKeyword(node)) {
          break
        }

        let declaration = this.declaration
        let { property, important } = declaration

        if (isAstVendorPrefixed(node)) {
          vendorPrefixedValues.push(stringifyNode(node), node.loc)
        }

        // i.e. `property: value !ie`
        if (typeof important === 'string') {
          valueBrowserhacks.push(stringifyNodePlain(node) + '!' + important, node.loc)
        }

        // i.e. `property: value\9`
        if (isIe9Hack(node)) {
          valueBrowserhacks.push(stringifyNode(node), node.loc)
        }

        // Process properties first that don't have colors,
        // so we can avoid further walking them;
        if (isProperty('z-index', property)) {
          zindex.push(stringifyNode(node), node.loc)
          return this.skip
        } else if (isProperty('font', property)) {
          if (isSystemFont(node)) return

          let { font_size, line_height, font_family } = destructure(node, stringifyNode)

          if (font_family) {
            fontFamilies.push(font_family, node.loc)
          }
          if (font_size) {
            fontSizes.push(font_size, node.loc)
          }
          if (line_height) {
            lineHeights.push(line_height, node.loc)
          }

          break
        } else if (isProperty('font-size', property)) {
          if (!isSystemFont(node)) {
            fontSizes.push(stringifyNode(node), node.loc)
          }
          break
        } else if (isProperty('font-family', property)) {
          if (!isSystemFont(node)) {
            fontFamilies.push(stringifyNode(node), node.loc)
          }
          break
        } else if (isProperty('line-height', property)) {
          lineHeights.push(stringifyNode(node), node.loc)
        } else if (isProperty('transition', property) || isProperty('animation', property)) {
          let [times, fns] = analyzeAnimation(node.children, stringifyNode)
          for (let i = 0; i < times.length; i++) {
            durations.push(times[i], node.loc)
          }
          for (let i = 0; i < fns.length; i++) {
            timingFunctions.push(fns[i], node.loc)
          }
          break
        } else if (isProperty('animation-duration', property) || isProperty('transition-duration', property)) {
          if (node.children && node.children.size > 1) {
            node.children.forEach(child => {
              if (child.type !== 'Operator') {
                durations.push(stringifyNode(child), node.loc)
              }
            })
          } else {
            durations.push(stringifyNode(node), node.loc)
          }
          break
        } else if (isProperty('transition-timing-function', property) || isProperty('animation-timing-function', property)) {
          if (node.children && node.children.size > 1) {
            node.children.forEach(child => {
              if (child.type !== 'Operator') {
                timingFunctions.push(stringifyNode(child), node.loc)
              }
            })
          } else {
            timingFunctions.push(stringifyNode(node), node.loc)
          }
          break
        } else if (isProperty('text-shadow', property)) {
          if (!isValueKeyword(node)) {
            textShadows.push(stringifyNode(node), node.loc)
          }
          // no break here: potentially contains colors
        } else if (isProperty('box-shadow', property)) {
          if (!isValueKeyword(node)) {
            boxShadows.push(stringifyNode(node), node.loc)
          }
          // no break here: potentially contains colors
        }

        walk(node, function (valueNode) {
          let nodeName = valueNode.name

          switch (valueNode.type) {
            case 'Hash': {
              let hexLength = valueNode.value.length
              if (endsWith('\\9', valueNode.value)) {
                hexLength = hexLength - 2
              }
              colors.push('#' + valueNode.value, property, valueNode.loc)
              colorFormats.push(`hex` + hexLength, valueNode.loc)

              return this.skip
            }
            case 'Identifier': {
              // Bail out if it can't be a color name
              // 20 === 'lightgoldenrodyellow'.length
              // 3 === 'red'.length
              if (nodeName.length > 20 || nodeName.length < 3) {
                return this.skip
              }

              if (namedColors.has(nodeName)) {
                let stringified = stringifyNode(valueNode)
                colors.push(stringified, property, valueNode.loc)
                colorFormats.push('named', valueNode.loc)
                return
              }

              if (colorKeywords.has(nodeName)) {
                let stringified = stringifyNode(valueNode)
                colors.push(stringified, property, valueNode.loc)
                colorFormats.push(nodeName.toLowerCase(), valueNode.loc)
                return
              }

              if (systemColors.has(nodeName)) {
                let stringified = stringifyNode(valueNode)
                colors.push(stringified, property, valueNode.loc)
                colorFormats.push('system', valueNode.loc)
                return
              }
              return this.skip
            }
            case 'Function': {
              // Don't walk var() multiple times
              if (strEquals('var', nodeName)) {
                return this.skip
              }

              if (colorFunctions.has(nodeName)) {
                colors.push(stringifyNode(valueNode), property, valueNode.loc)
                colorFormats.push(nodeName.toLowerCase(), valueNode.loc)
                return
              }

              if (endsWith('gradient', nodeName)) {
                gradients.push(stringifyNode(valueNode), valueNode.loc)
                return
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

        uniqueDeclarations.add(stringifyNode(node))

        if (node.important === true) {
          importantDeclarations++

          if (this.atrule && endsWith('keyframes', this.atrule.name)) {
            importantsInKeyframes++
          }
        }

        let { property } = node
        let propertyLoc = {
          start: {
            line: node.loc.start.line,
            column: node.loc.start.column,
            offset: node.loc.start.offset
          },
          end: {
            offset: node.loc.start.offset + property.length
          }
        }

        properties.push(property, propertyLoc)

        if (hasVendorPrefix(property)) {
          propertyVendorPrefixes.push(property, propertyLoc)
          propertyComplexities.push(2)
        } else if (isHack(property)) {
          propertyHacks.push(property, propertyLoc)
          propertyComplexities.push(2)
        } else if (isCustom(property)) {
          customProperties.push(property, propertyLoc)
          propertyComplexities.push(2)
          if (node.important === true) {
            importantCustomProperties.push(property, propertyLoc)
          }
        } else {
          propertyComplexities.push(1)
        }
        break
      }
    }
  })

  let embeddedContent = embeds.count()

  let totalUniqueDeclarations = uniqueDeclarations.size

  let totalSelectors = selectorComplexities.size()
  let specificitiesA = specificityA.aggregate()
  let specificitiesB = specificityB.aggregate()
  let specificitiesC = specificityC.aggregate()
  let totalUniqueSelectors = uniqueSelectors.size
  let assign = Object.assign

  return {
    stylesheet: {
      sourceLinesOfCode: totalAtRules + totalSelectors + totalDeclarations + keyframeSelectors.size(),
      linesOfCode,
      size: css.length,
      comments: {
        total: totalComments,
        size: commentsSize,
      },
      embeddedContent: assign(embeddedContent, {
        size: {
          total: embedSize,
          ratio: ratio(embedSize, css.length),
        },
        types: {
          total: embedTypes.total,
          totalUnique: embedTypes.unique.size,
          uniquenessRatio: ratio(embedTypes.unique.size, embedTypes.total),
          unique: Object.fromEntries(embedTypes.unique),
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
          ratio: ratio(prefixedKeyframes.size(), keyframes.size())
        }),
      }),
      container: containers.count(),
      layer: layers.count(),
      property: registeredProperties.count(),
    },
    rules: {
      total: totalRules,
      empty: {
        total: emptyRules,
        ratio: ratio(emptyRules, totalRules)
      },
      sizes: assign(
        ruleSizes.aggregate(),
        {
          items: ruleSizes.toArray(),
        },
        uniqueRuleSize.count(),
      ),
      selectors: assign(
        selectorsPerRule.aggregate(),
        {
          items: selectorsPerRule.toArray(),
        },
        uniqueSelectorsPerRule.count(),
      ),
      declarations: assign(
        declarationsPerRule.aggregate(),
        {
          items: declarationsPerRule.toArray(),
        },
        uniqueDeclarationsPerRule.count(),
      ),
    },
    selectors: {
      total: totalSelectors,
      totalUnique: totalUniqueSelectors,
      uniquenessRatio: ratio(totalUniqueSelectors, totalSelectors),
      specificity: assign(
        {
          /** @type Specificity */
          min: minSpecificity === undefined ? [0, 0, 0] : minSpecificity,
          /** @type Specificity */
          max: maxSpecificity === undefined ? [0, 0, 0] : maxSpecificity,
          /** @type Specificity */
          sum: [specificitiesA.sum, specificitiesB.sum, specificitiesC.sum],
          /** @type Specificity */
          mean: [specificitiesA.mean, specificitiesB.mean, specificitiesC.mean],
          /** @type Specificity */
          mode: [specificitiesA.mode, specificitiesB.mode, specificitiesC.mode],
          /** @type Specificity */
          median: [specificitiesA.median, specificitiesB.median, specificitiesC.median],
          items: specificities,
        },
        uniqueSpecificities.count(),
      ),
      complexity: assign(
        selectorComplexities.aggregate(),
        uniqueSelectorComplexities.count(),
        {
          items: selectorComplexities.toArray(),
        }
      ),
      id: assign(
        ids.count(), {
        ratio: ratio(ids.size(), totalSelectors),
      }),
      accessibility: assign(
        a11y.count(), {
        ratio: ratio(a11y.size(), totalSelectors),
      }),
      keyframes: keyframeSelectors.count(),
      prefixed: assign(
        prefixedSelectors.count(),
        {
          ratio: ratio(prefixedSelectors.size(), totalSelectors),
        },
      ),
      combinators: combinators.count(),
    },
    declarations: {
      total: totalDeclarations,
      totalUnique: totalUniqueDeclarations,
      uniquenessRatio: ratio(totalUniqueDeclarations, totalDeclarations),
      // @TODO: deprecated, remove in next major version
      unique: {
        total: totalUniqueDeclarations,
        ratio: ratio(totalUniqueDeclarations, totalDeclarations),
      },
      importants: {
        total: importantDeclarations,
        ratio: ratio(importantDeclarations, totalDeclarations),
        inKeyframes: {
          total: importantsInKeyframes,
          ratio: ratio(importantsInKeyframes, importantDeclarations),
        },
      },
    },
    properties: assign(
      properties.count(),
      {
        prefixed: assign(
          propertyVendorPrefixes.count(),
          {
            ratio: ratio(propertyVendorPrefixes.size(), properties.size()),
          },
        ),
        custom: assign(
          customProperties.count(),
          {
            ratio: ratio(customProperties.size(), properties.size()),
            importants: assign(
              importantCustomProperties.count(),
              {
                ratio: ratio(importantCustomProperties.size(), customProperties.size()),
              }
            ),
          },
        ),
        browserhacks: assign(
          propertyHacks.count(), {
          ratio: ratio(propertyHacks.size(), properties.size()),
        }),
        complexity: propertyComplexities.aggregate(),
      }),
    values: {
      colors: assign(
        colors.count(),
        {
          formats: colorFormats.count(),
        },
      ),
      gradients: gradients.count(),
      fontFamilies: fontFamilies.count(),
      fontSizes: fontSizes.count(),
      lineHeights: lineHeights.count(),
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

/**
 * Compare specificity A to Specificity B
 * @param {Specificity} a - Specificity A
 * @param {Specificity} b - Specificity B
 * @returns {number} sortIndex - 0 when a==b, 1 when a<b, -1 when a>b
 */
export function compareSpecificity(a, b) {
  if (a[0] === b[0]) {
    if (a[1] === b[1]) {
      return b[2] - a[2]
    }

    return b[1] - a[1]
  }

  return b[0] - a[0]
}