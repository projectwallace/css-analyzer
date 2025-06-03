import parse from 'css-tree/parser'
import walk from 'css-tree/walker'
import { calculateForAST } from '@bramus/specificity/core'
import { isSupportsBrowserhack, isMediaBrowserhack } from './atrules/atrules.js'
import { getCombinators, getComplexity, isAccessibility, isPrefixed, hasPseudoClass } from './selectors/utils.js'
import { colorFunctions, colorKeywords, namedColors, systemColors } from './values/colors.js'
import { destructure, isSystemFont } from './values/destructure-font-shorthand.js'
import { isValueKeyword, keywords } from './values/values.js'
import { analyzeAnimation } from './values/animations.js'
import { isValuePrefixed } from './values/vendor-prefix.js'
import { ContextCollection } from './context-collection.js'
import { Collection } from './collection.js'
import { AggregateCollection } from './aggregate-collection.js'
import { strEquals, startsWith, endsWith } from './string-utils.js'
import { hasVendorPrefix } from './vendor-prefix.js'
import { isCustom, isHack, isProperty } from './properties/property-utils.js'
import { getEmbedType } from './stylesheet/stylesheet.js'
import { isIe9Hack } from './values/browserhacks.js'
import { basename } from './properties/property-utils.js'
import {
  Atrule,
  Selector,
  Dimension,
  Url,
  Value,
  Declaration,
  Hash,
  Rule,
  Identifier,
  Func,
  Operator
} from './css-tree-node-types.js'
import { KeywordSet } from './keyword-set.js'

/** @typedef {[number, number, number]} Specificity */

let border_radius_properties = new KeywordSet([
  'border-radius',
  'border-top-left-radius',
  'border-top-right-radius',
  'border-bottom-right-radius',
  'border-bottom-left-radius',
  'border-start-start-radius',
  'border-start-end-radius',
  'border-end-end-radius',
  'border-end-start-radius',
])

function ratio(part, total) {
  if (total === 0) return 0
  return part / total
}

let defaults = {
  useLocations: false
}

/**
 * @typedef Options
 * @property {boolean} useLocations Use Locations (`{ 'item': [{ line, column, offset, length }] }`) instead of a regular count per occurrence (`{ 'item': 3 }`)
 */

/**
 * Analyze CSS
 * @param {string} css
 * @param {Options} options
 */
export function analyze(css, options = {}) {
  let settings = Object.assign({}, defaults, options)
  let useLocations = settings.useLocations === true
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
    let loc = node.loc
    return css.substring(loc.start.offset, loc.end.offset)
  }

  // Stylesheet
  let totalComments = 0
  let commentsSize = 0
  let embedSize = 0
  let embedTypes = {
    total: 0,
    /** @type {Map<string, { size: number, count: number } & ({ uniqueWithLocations?: undefined } | ({ uniqueWithLocations: { offset: number, line: number, column: number, length: number }[] })) }>} */
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
  let atRuleComplexities = new AggregateCollection()
  /** @type {Record<string, string>[]} */
  let fontfaces = []
  let fontfaces_with_loc = new Collection(useLocations)
  let layers = new Collection(useLocations)
  let imports = new Collection(useLocations)
  let medias = new Collection(useLocations)
  let mediaBrowserhacks = new Collection(useLocations)
  let mediaFeatures = new Collection(useLocations)
  let charsets = new Collection(useLocations)
  let supports = new Collection(useLocations)
  let supportsBrowserhacks = new Collection(useLocations)
  let keyframes = new Collection(useLocations)
  let prefixedKeyframes = new Collection(useLocations)
  let containers = new Collection(useLocations)
  let containerNames = new Collection(useLocations)
  let registeredProperties = new Collection(useLocations)

  // Rules
  let totalRules = 0
  let emptyRules = 0
  let ruleSizes = new AggregateCollection()
  let selectorsPerRule = new AggregateCollection()
  let declarationsPerRule = new AggregateCollection()
  let uniqueRuleSize = new Collection(useLocations)
  let uniqueSelectorsPerRule = new Collection(useLocations)
  let uniqueDeclarationsPerRule = new Collection(useLocations)

  // Selectors
  let keyframeSelectors = new Collection(useLocations)
  let uniqueSelectors = new Set()
  let prefixedSelectors = new Collection(useLocations)
  /** @type {Specificity} */
  let maxSpecificity
  /** @type {Specificity} */
  let minSpecificity
  let specificityA = new AggregateCollection()
  let specificityB = new AggregateCollection()
  let specificityC = new AggregateCollection()
  let uniqueSpecificities = new Collection(useLocations)
  let selectorComplexities = new AggregateCollection()
  let uniqueSelectorComplexities = new Collection(useLocations)
  /** @type {Specificity[]} */
  let specificities = []
  let ids = new Collection(useLocations)
  let a11y = new Collection(useLocations)
  let pseudoClasses = new Collection(useLocations)
  let combinators = new Collection(useLocations)

  // Declarations
  let uniqueDeclarations = new Set()
  let totalDeclarations = 0
  let declarationComplexities = new AggregateCollection()
  let importantDeclarations = 0
  let importantsInKeyframes = 0
  let importantCustomProperties = new Collection(useLocations)

  // Properties
  let properties = new Collection(useLocations)
  let propertyHacks = new Collection(useLocations)
  let propertyVendorPrefixes = new Collection(useLocations)
  let customProperties = new Collection(useLocations)
  let propertyComplexities = new AggregateCollection()

  // Values
  let valueComplexities = new AggregateCollection()
  let vendorPrefixedValues = new Collection(useLocations)
  let valueBrowserhacks = new Collection(useLocations)
  let zindex = new Collection(useLocations)
  let textShadows = new Collection(useLocations)
  let boxShadows = new Collection(useLocations)
  let fontFamilies = new Collection(useLocations)
  let fontSizes = new Collection(useLocations)
  let lineHeights = new Collection(useLocations)
  let timingFunctions = new Collection(useLocations)
  let durations = new Collection(useLocations)
  let colors = new ContextCollection(useLocations)
  let colorFormats = new Collection(useLocations)
  let units = new ContextCollection(useLocations)
  let gradients = new Collection(useLocations)
  let valueKeywords = new Collection(useLocations)
  let borderRadiuses = new ContextCollection(useLocations)

  walk(ast, function (node) {
    switch (node.type) {
      case Atrule: {
        totalAtRules++

        let atRuleName = node.name

        if (atRuleName === 'font-face') {
          let descriptors = {}

          if (useLocations) {
            fontfaces_with_loc.p(node.loc.start.offset, node.loc)
          }

          node.block.children.forEach(descriptor => {
            // Ignore 'Raw' nodes in case of CSS syntax errors
            if (descriptor.type === Declaration) {
              descriptors[descriptor.property] = stringifyNode(descriptor.value)
            }
          })

          fontfaces.push(descriptors)
          atRuleComplexities.push(1)
          break
        }

        let complexity = 1

        // All the AtRules in here MUST have a prelude, so we can count their names
        if (node.prelude !== null) {
          let prelude = node.prelude
          let preludeStr = prelude && stringifyNode(node.prelude)
          let loc = prelude.loc

          if (atRuleName === 'media') {
            medias.p(preludeStr, loc)
            if (isMediaBrowserhack(prelude)) {
              mediaBrowserhacks.p(preludeStr, loc)
              complexity++
            }
          } else if (atRuleName === 'supports') {
            supports.p(preludeStr, loc)
            // TODO: analyze vendor prefixes in @supports
            // TODO: analyze complexity of @supports 'declaration'
            if (isSupportsBrowserhack(prelude)) {
              supportsBrowserhacks.p(preludeStr, loc)
              complexity++
            }
          } else if (endsWith('keyframes', atRuleName)) {
            let name = '@' + atRuleName + ' ' + preludeStr
            if (hasVendorPrefix(atRuleName)) {
              prefixedKeyframes.p(name, loc)
              complexity++
            }
            keyframes.p(name, loc)
          } else if (atRuleName === 'import') {
            walk(node, function (prelude_node) {
              if (prelude_node.type === 'Condition' && prelude_node.kind === 'supports') {
                let prelude = stringifyNode(prelude_node)

                supports.p(prelude, prelude_node.loc)
                return this.break
              }
            })
            imports.p(preludeStr, loc)
            // TODO: analyze complexity of media queries, layers and supports in @import
            // see https://github.com/projectwallace/css-analyzer/issues/326
          } else if (atRuleName === 'charset') {
            charsets.p(preludeStr, loc)
          } else if (atRuleName === 'container') {
            containers.p(preludeStr, loc)

            if (prelude.children.first?.type === 'Identifier') {
              let containerName = prelude.children.first.name
              containerNames.p(containerName, loc)
            }
            // TODO: calculate complexity of container 'declaration'
          } else if (atRuleName === 'property') {
            registeredProperties.p(preludeStr, loc)
            // TODO: add complexity for descriptors
          }
        } else {
          if (atRuleName === 'layer') {
            layers.p('<anonymous>', node.loc)
            complexity++
          }
        }
        atRuleComplexities.push(complexity)
        break
      }
      case 'Layer': {
        if (node.name !== null) {
          layers.p(node.name, node.loc)
        }
        break
      }
      case 'Feature': {
        mediaFeatures.p(node.name, node.loc)
        break
      }
      case Rule: {
        let prelude = node.prelude
        let block = node.block
        let preludeChildren = prelude.children
        let blockChildren = block.children
        let numSelectors = preludeChildren ? preludeChildren.size : 0
        let numDeclarations = blockChildren ? blockChildren.size : 0

        ruleSizes.push(numSelectors + numDeclarations)
        uniqueRuleSize.p(numSelectors + numDeclarations, node.loc)
        selectorsPerRule.push(numSelectors)
        uniqueSelectorsPerRule.p(numSelectors, prelude.loc)
        declarationsPerRule.push(numDeclarations)
        uniqueDeclarationsPerRule.p(numDeclarations, block.loc)

        totalRules++

        if (numDeclarations === 0) {
          emptyRules++
        }
        break
      }
      case Selector: {
        let selector = stringifyNode(node)

        if (this.atrule && endsWith('keyframes', this.atrule.name)) {
          keyframeSelectors.p(selector, node.loc)
          return this.skip
        }

        if (isAccessibility(node)) {
          a11y.p(selector, node.loc)
        }

        let pseudos = hasPseudoClass(node)
        if (pseudos !== false) {
          for (let pseudo of pseudos) {
            pseudoClasses.p(pseudo, node.loc)
          }
        }

        let complexity = getComplexity(node)

        if (isPrefixed(node)) {
          prefixedSelectors.p(selector, node.loc)
        }

        uniqueSelectors.add(selector)
        selectorComplexities.push(complexity)
        uniqueSelectorComplexities.p(complexity, node.loc)

        // #region specificity
        let specificity = calculateForAST(node).toArray()
        let [sa, sb, sc] = specificity

        uniqueSpecificities.p(specificity.toString(), node.loc)

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
          ids.p(selector, node.loc)
        }

        getCombinators(node, function onCombinator(combinator) {
          combinators.p(combinator.name, combinator.loc)
        })

        // Avoid deeper walking of selectors to not mess with
        // our specificity calculations in case of a selector
        // with :where() or :is() that contain SelectorLists
        // as children
        return this.skip
      }
      case Dimension: {
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
      case Url: {
        if (startsWith('data:', node.value)) {
          let embed = node.value
          let size = embed.length
          let type = getEmbedType(embed)

          embedTypes.total++
          embedSize += size

          let loc = {
            /** @type {number} */
            line: node.loc.start.line,
            /** @type {number} */
            column: node.loc.start.column,
            /** @type {number} */
            offset: node.loc.start.offset,
            /** @type {number} */
            length: node.loc.end.offset - node.loc.start.offset,
          }

          if (embedTypes.unique.has(type)) {
            let item = embedTypes.unique.get(type)
            item.count++
            item.size += size
            embedTypes.unique.set(type, item)
            if (useLocations) {
              item.uniqueWithLocations.push(loc)
            }
          } else {
            let item = {
              count: 1,
              size
            }
            if (useLocations) {
              item.uniqueWithLocations = [loc]
            }
            embedTypes.unique.set(type, item)
          }
        }
        break
      }
      case Value: {
        if (isValueKeyword(node)) {
          valueComplexities.push(1)
          valueKeywords.p(stringifyNode(node), node.loc)
          break
        }

        let declaration = this.declaration
        let { property, important } = declaration
        let complexity = 1

        // i.e. `background-image: -webkit-linear-gradient()`
        if (isValuePrefixed(node)) {
          vendorPrefixedValues.p(stringifyNode(node), node.loc)
          complexity++
        }

        // i.e. `property: value !ie`
        if (typeof important === 'string') {
          valueBrowserhacks.p(stringifyNodePlain(node) + '!' + important, node.loc)
          complexity++
        }

        // i.e. `property: value\9`
        if (isIe9Hack(node)) {
          valueBrowserhacks.p(stringifyNode(node), node.loc)
          complexity++
        }

        let children = node.children
        let loc = node.loc

        // TODO: should shorthands be counted towards complexity?
        valueComplexities.push(complexity)

        // Process properties first that don't have colors,
        // so we can avoid further walking them;
        if (isProperty('z-index', property)) {
          zindex.p(stringifyNode(node), loc)
          return this.skip
        } else if (isProperty('font', property)) {
          if (isSystemFont(node)) return

          let { font_size, line_height, font_family } = destructure(node, stringifyNode, function (item) {
            if (item.type === 'keyword') {
              valueKeywords.p(item.value, loc)
            }
          })

          if (font_family) {
            fontFamilies.p(font_family, loc)
          }

          if (font_size) {
            fontSizes.p(font_size, loc)
          }

          if (line_height) {
            lineHeights.p(line_height, loc)
          }

          break
        } else if (isProperty('font-size', property)) {
          if (!isSystemFont(node)) {
            fontSizes.p(stringifyNode(node), loc)
          }
          break
        } else if (isProperty('font-family', property)) {
          if (!isSystemFont(node)) {
            fontFamilies.p(stringifyNode(node), loc)
          }
          break
        } else if (isProperty('line-height', property)) {
          lineHeights.p(stringifyNode(node), loc)
        } else if (isProperty('transition', property) || isProperty('animation', property)) {
          analyzeAnimation(children, function (item) {
            if (item.type === 'fn') {
              timingFunctions.p(stringifyNode(item.value), loc)
            } else if (item.type === 'duration') {
              durations.p(stringifyNode(item.value), loc)
            } else if (item.type === 'keyword') {
              valueKeywords.p(stringifyNode(item.value), loc)
            }
          })
          break
        } else if (isProperty('animation-duration', property) || isProperty('transition-duration', property)) {
          if (children && children.size > 1) {
            children.forEach(child => {
              if (child.type !== Operator) {
                durations.p(stringifyNode(child), loc)
              }
            })
          } else {
            durations.p(stringifyNode(node), loc)
          }
          break
        } else if (isProperty('transition-timing-function', property) || isProperty('animation-timing-function', property)) {
          if (children && children.size > 1) {
            children.forEach(child => {
              if (child.type !== Operator) {
                timingFunctions.p(stringifyNode(child), loc)
              }
            })
          } else {
            timingFunctions.p(stringifyNode(node), loc)
          }
          break
        }
        else if (isProperty('container-name', property)) {
          containerNames.p(stringifyNode(node), loc)
        }
        else if (isProperty('container', property)) {
          // The first identifier is the container name
          // Example: container: my-layout / inline-size;
          if (children.first?.type === 'Identifier') {
            containerNames.p(children.first.name, loc)
          }
        }
        else if (border_radius_properties.has(basename(property))) {
          if (!isValueKeyword(node)) {
            borderRadiuses.push(stringifyNode(node), property, loc)
          }
          break
        } else if (isProperty('text-shadow', property)) {
          if (!isValueKeyword(node)) {
            textShadows.p(stringifyNode(node), loc)
          }
          // no break here: potentially contains colors
        } else if (isProperty('box-shadow', property)) {
          if (!isValueKeyword(node)) {
            boxShadows.p(stringifyNode(node), loc)
          }
          // no break here: potentially contains colors
        }

        walk(node, function (valueNode) {
          let nodeName = valueNode.name

          switch (valueNode.type) {
            case Hash: {
              let hexLength = valueNode.value.length
              if (endsWith('\\9', valueNode.value)) {
                hexLength = hexLength - 2
              }
              colors.push('#' + valueNode.value, property, loc)
              colorFormats.p(`hex` + hexLength, loc)

              return this.skip
            }
            case Identifier: {
              if (keywords.has(nodeName)) {
                valueKeywords.p(nodeName, loc)
              }

              // Bail out if it can't be a color name
              // 20 === 'lightgoldenrodyellow'.length
              // 3 === 'red'.length
              let nodeLen = nodeName.length
              if (nodeLen > 20 || nodeLen < 3) {
                return this.skip
              }

              // A keyword is most likely to be 'transparent' or 'currentColor'
              if (colorKeywords.has(nodeName)) {
                let stringified = stringifyNode(valueNode)
                colors.push(stringified, property, loc)
                colorFormats.p(nodeName.toLowerCase(), loc)
                return
              }

              // Or it can be a named color
              if (namedColors.has(nodeName)) {
                let stringified = stringifyNode(valueNode)
                colors.push(stringified, property, loc)
                colorFormats.p('named', loc)
                return
              }

              // Or it can be a system color
              if (systemColors.has(nodeName)) {
                let stringified = stringifyNode(valueNode)
                colors.push(stringified, property, loc)
                colorFormats.p('system', loc)
                return
              }
              return this.skip
            }
            case Func: {
              // Don't walk var() multiple times
              if (strEquals('var', nodeName)) {
                return this.skip
              }

              // rgb(a), hsl(a), color(), hwb(), lch(), lab(), oklab(), oklch()
              if (colorFunctions.has(nodeName)) {
                colors.push(stringifyNode(valueNode), property, valueNode.loc)
                colorFormats.p(nodeName.toLowerCase(), valueNode.loc)
                return
              }

              if (endsWith('gradient', nodeName)) {
                gradients.p(stringifyNode(valueNode), valueNode.loc)
                return
              }
              // No this.skip here intentionally,
              // otherwise we'll miss colors in linear-gradient() etc.
            }
          }
        })
        break
      }
      case Declaration: {
        // Do not process Declarations in atRule preludes
        // because we will handle them manually
        if (this.atrulePrelude !== null) {
          return this.skip
        }

        totalDeclarations++
        let complexity = 1

        uniqueDeclarations.add(stringifyNode(node))

        if (node.important === true) {
          importantDeclarations++
          complexity++

          if (this.atrule && endsWith('keyframes', this.atrule.name)) {
            importantsInKeyframes++
            complexity++
          }
        }

        declarationComplexities.push(complexity)

        let { property, loc: { start } } = node
        let propertyLoc = {
          start: {
            line: start.line,
            column: start.column,
            offset: start.offset
          },
          end: {
            offset: start.offset + property.length
          }
        }

        properties.p(property, propertyLoc)

        if (hasVendorPrefix(property)) {
          propertyVendorPrefixes.p(property, propertyLoc)
          propertyComplexities.push(2)
        } else if (isHack(property)) {
          propertyHacks.p(property, propertyLoc)
          propertyComplexities.push(2)
        } else if (isCustom(property)) {
          customProperties.p(property, propertyLoc)
          propertyComplexities.push(node.important ? 3 : 2)

          if (node.important === true) {
            importantCustomProperties.p(property, propertyLoc)
          }
        } else {
          propertyComplexities.push(1)
        }

        break
      }
    }
  })

  let totalUniqueDeclarations = uniqueDeclarations.size

  let totalSelectors = selectorComplexities.size()
  let specificitiesA = specificityA.aggregate()
  let specificitiesB = specificityB.aggregate()
  let specificitiesC = specificityC.aggregate()
  let totalUniqueSelectors = uniqueSelectors.size
  let assign = Object.assign
  let cssLen = css.length
  let fontFacesCount = fontfaces.length
  let atRuleComplexity = atRuleComplexities.aggregate()
  let selectorComplexity = selectorComplexities.aggregate()
  let declarationComplexity = declarationComplexities.aggregate()
  let propertyComplexity = propertyComplexities.aggregate()
  let valueComplexity = valueComplexities.aggregate()

  return {
    stylesheet: {
      sourceLinesOfCode: totalAtRules + totalSelectors + totalDeclarations + keyframeSelectors.size(),
      linesOfCode,
      size: cssLen,
      complexity: atRuleComplexity.sum + selectorComplexity.sum + declarationComplexity.sum + propertyComplexity.sum + valueComplexity.sum,
      comments: {
        total: totalComments,
        size: commentsSize,
      },
      embeddedContent: {
        size: {
          total: embedSize,
          ratio: ratio(embedSize, cssLen),
        },
        types: {
          total: embedTypes.total,
          totalUnique: embedTypes.unique.size,
          uniquenessRatio: ratio(embedTypes.unique.size, embedTypes.total),
          unique: Object.fromEntries(embedTypes.unique),
        },
      },
    },
    atrules: {
      fontface: assign({
        total: fontFacesCount,
        totalUnique: fontFacesCount,
        unique: fontfaces,
        uniquenessRatio: fontFacesCount === 0 ? 0 : 1,
      }, useLocations ? {
        uniqueWithLocations: fontfaces_with_loc.c().uniqueWithLocations,
      } : {}),
      import: imports.c(),
      media: assign(
        medias.c(),
        {
          browserhacks: mediaBrowserhacks.c(),
          features: mediaFeatures.c(),
        }
      ),
      charset: charsets.c(),
      supports: assign(
        supports.c(),
        {
          browserhacks: supportsBrowserhacks.c(),
        },
      ),
      keyframes: assign(
        keyframes.c(), {
        prefixed: assign(
          prefixedKeyframes.c(), {
          ratio: ratio(prefixedKeyframes.size(), keyframes.size())
        }),
      }),
      container: assign(
        containers.c(),
        {
          names: containerNames.c(),
        }
      ),
      layer: layers.c(),
      property: registeredProperties.c(),
      total: totalAtRules,
      complexity: atRuleComplexity
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
        uniqueRuleSize.c(),
      ),
      selectors: assign(
        selectorsPerRule.aggregate(),
        {
          items: selectorsPerRule.toArray(),
        },
        uniqueSelectorsPerRule.c(),
      ),
      declarations: assign(
        declarationsPerRule.aggregate(),
        {
          items: declarationsPerRule.toArray(),
        },
        uniqueDeclarationsPerRule.c(),
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
          items: specificities,
        },
        uniqueSpecificities.c(),
      ),
      complexity: assign(
        selectorComplexity,
        uniqueSelectorComplexities.c(),
        {
          items: selectorComplexities.toArray(),
        }
      ),
      id: assign(
        ids.c(), {
        ratio: ratio(ids.size(), totalSelectors),
      }),
      pseudoClasses: pseudoClasses.c(),
      accessibility: assign(
        a11y.c(), {
        ratio: ratio(a11y.size(), totalSelectors),
      }),
      keyframes: keyframeSelectors.c(),
      prefixed: assign(
        prefixedSelectors.c(),
        {
          ratio: ratio(prefixedSelectors.size(), totalSelectors),
        },
      ),
      combinators: combinators.c(),
    },
    declarations: {
      total: totalDeclarations,
      totalUnique: totalUniqueDeclarations,
      uniquenessRatio: ratio(totalUniqueDeclarations, totalDeclarations),
      importants: {
        total: importantDeclarations,
        ratio: ratio(importantDeclarations, totalDeclarations),
        inKeyframes: {
          total: importantsInKeyframes,
          ratio: ratio(importantsInKeyframes, importantDeclarations),
        },
      },
      complexity: declarationComplexity,
    },
    properties: assign(
      properties.c(),
      {
        prefixed: assign(
          propertyVendorPrefixes.c(),
          {
            ratio: ratio(propertyVendorPrefixes.size(), properties.size()),
          },
        ),
        custom: assign(
          customProperties.c(),
          {
            ratio: ratio(customProperties.size(), properties.size()),
            importants: assign(
              importantCustomProperties.c(),
              {
                ratio: ratio(importantCustomProperties.size(), customProperties.size()),
              }
            ),
          },
        ),
        browserhacks: assign(
          propertyHacks.c(), {
          ratio: ratio(propertyHacks.size(), properties.size()),
        }),
        complexity: propertyComplexity,
      }),
    values: {
      colors: assign(
        colors.count(),
        {
          formats: colorFormats.c(),
        },
      ),
      gradients: gradients.c(),
      fontFamilies: fontFamilies.c(),
      fontSizes: fontSizes.c(),
      lineHeights: lineHeights.c(),
      zindexes: zindex.c(),
      textShadows: textShadows.c(),
      boxShadows: boxShadows.c(),
      borderRadiuses: borderRadiuses.count(),
      animations: {
        durations: durations.c(),
        timingFunctions: timingFunctions.c(),
      },
      prefixes: vendorPrefixedValues.c(),
      browserhacks: valueBrowserhacks.c(),
      units: units.count(),
      complexity: valueComplexity,
      keywords: valueKeywords.c(),
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

export {
  getComplexity as selectorComplexity,
  isPrefixed as isSelectorPrefixed,
  isAccessibility as isAccessibilitySelector,
} from './selectors/utils.js'

export {
  isSupportsBrowserhack,
  isMediaBrowserhack
} from './atrules/atrules.js'

export {
  isHack as isPropertyHack,
} from './properties/property-utils.js'

export {
  isValuePrefixed
} from './values/vendor-prefix.js'

export { hasVendorPrefix } from './vendor-prefix.js'
