import parse from 'css-tree/parser'
import walk from 'css-tree/walker'
import { calculate } from '@bramus/specificity/core'
import { isSupportsBrowserhack, isMediaBrowserhack } from './atrules/atrules.js'
import { getComplexity, isAccessibility, compareSpecificity } from './selectors/utils.js'
import { colorFunctions, colorKeywords, namedColors, systemColors } from './values/colors.js'
// import { isFontFamilyKeyword, getFamilyFromFont } from './values/font-families.js'
import { destructure, isFontKeyword } from './values/destructure-font-shorthand.js'
// import { isFontSizeKeyword, getSizeFromFont } from './values/font-sizes.js'
import { isValueKeyword } from './values/values.js'
import { analyzeAnimation } from './values/animations.js'
import { isAstVendorPrefixed } from './values/vendor-prefix.js'
import { ContextCollection } from './context-collection.js'
import { CountableCollection } from './countable-collection.js'
import { AggregateCollection } from './aggregate-collection.js'
import { strEquals, startsWith, endsWith } from './string-utils.js'
import { hasVendorPrefix } from './vendor-prefix.js'
import { isCustom, isHack, isProperty } from './properties/property-utils.js'
import { getEmbedType } from './stylesheet/stylesheet.js'
import { isIe9Hack } from './values/browserhacks.js'
import { PropertiesCollection } from './properties/properties-collection.js'
import { hashArray } from './murmurhash.js'
import { NodeList } from './node-list.js'

import {
  is_atrule,
  is_declaration,
  is_dimension,
  is_function,
  is_hash,
  is_identifier,
  is_rule,
  is_selector,
  is_url,
  is_value,
} from './css-node.js'

/**
 * @param {number} part
 * @param {number} total
 */
function ratio(part, total) {
  if (total === 0) return 0
  return part / total
}

/**
 * Analyze CSS
 * @param {string} css
 */
const analyze = (css) => {
  /**
   * Recreate the authored CSS from a CSSTree node
   * @param {import('css-tree').CssNode} node - Node from CSSTree AST to stringify
   * @returns {string} str - The stringified node
   */
  function stringifyNode(node) {
    return stringifyNodePlain(node).trim()
  }

  /** @param {import('css-tree').CssNode} node */
  function stringifyNodePlain(node) {
    return css.substring(node.loc.start.offset, node.loc.end.offset)
  }

  /** @param {import('css-tree').CssNode} node */
  function createTokenArray(node) {
    if (!node.loc) {
      return new Uint16Array(0)
    }
    let start = node.loc.start.offset
    let end = node.loc.end.offset
    let length = end - start
    let tokens = new Uint16Array(length)

    let index = length
    while (index--) {
      tokens[index] = css.charCodeAt(index + start)
    }
    return tokens
  }

  let interesting_nodes = new NodeList()

  /** @param {number} index */
  function stringify_index(index) {
    let node = interesting_nodes.at(index)
    return css.substring(node.offset, node.offset + node.length)
  }

  // Stylesheet
  let totalComments = 0
  let commentsSize = 0
  let embedSize = 0
  let embedTypes = {
    total: 0,
    unique: new Map()
  }

  /** @type import('css-tree').CssNode */
  let ast = parse(css, {
    parseCustomProperty: true, // To find font-families, colors, etc.
    positions: true, // So we can use stringifyNode()
    /** @param {string} comment */
    onComment: function (comment) {
      totalComments++
      commentsSize += comment.length
    },
  })
  /** @type import('css-tree').CssLocation */
  let stylesheet = ast.loc
  let linesOfCode = stylesheet.end.line - stylesheet.start.line + 1

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
  const uniqueSelectors = new Set()
  const prefixedSelectors = new CountableCollection()
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
  const uniqueDeclarations = new Set()
  let totalDeclarations = 0
  let importantDeclarations = 0
  let importantsInKeyframes = 0
  let importantCustomProperties = new CountableCollection()

  // Properties
  let props = new PropertiesCollection()
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
  const lineHeights = new CountableCollection()
  const timingFunctions = new CountableCollection()
  const durations = new CountableCollection()
  const colors = new ContextCollection()
  const colorFormats = new CountableCollection()
  const units = new ContextCollection()

  walk(
    ast,
    /** @param {import('css-tree').CssNode} node */
    function (node) {
      let node_type = node.type

      if (is_atrule(node_type)) {
        totalAtRules++
        const atRuleName = node.name

        if (strEquals('font-face', atRuleName)) {
          /** @type {[index: string]: string} */
          const descriptors = {}

          node.block.children.forEach(descriptor => {
            // Ignore 'Raw' nodes in case of CSS syntax errors
            if (is_declaration(descriptor.type)) {
              descriptors[descriptor.property] = stringifyNode(descriptor.value)
            }
          })

          fontfaces.push(descriptors)
          return
        }

        if (strEquals('media', atRuleName)) {
          const prelude = stringifyNode(node.prelude)
          medias.push(prelude)
          if (isMediaBrowserhack(node.prelude)) {
            mediaBrowserhacks.push(prelude)
          }
          return
        }
        if (strEquals('supports', atRuleName)) {
          const prelude = stringifyNode(node.prelude)
          supports.push(prelude)
          if (isSupportsBrowserhack(node.prelude)) {
            supportsBrowserhacks.push(prelude)
          }
          return
        }
        if (endsWith('keyframes', atRuleName)) {
          const name = '@' + atRuleName + ' ' + stringifyNode(node.prelude)
          if (hasVendorPrefix(atRuleName)) {
            prefixedKeyframes.push(name)
          }
          keyframes.push(name)
          return
        }
        if (strEquals('import', atRuleName)) {
          imports.push(stringifyNode(node.prelude))
          return
        }
        if (strEquals('charset', atRuleName)) {
          charsets.push(stringifyNode(node.prelude))
          return
        }
        if (strEquals('container', atRuleName)) {
          containers.push(stringifyNode(node.prelude))
          return
        }
        if (strEquals('layer', atRuleName)) {
          const prelude = stringifyNode(node.prelude)
          prelude
            .split(',')
            .forEach(name => layers.push(name.trim()))
        }
        return
      }

      if (is_rule(node_type)) {
        const numSelectors = node.prelude.children ? node.prelude.children.size : 0
        const numDeclarations = node.block.children ? node.block.children.size : 0

        ruleSizes.push(numSelectors + numDeclarations)
        selectorsPerRule.push(numSelectors)
        declarationsPerRule.push(numDeclarations)

        totalRules++

        if (numDeclarations === 0) {
          emptyRules++
        }

        return
      }

      if (is_selector(node_type)) {
        const selector = stringifyNode(node)

        if (this.atrule && endsWith('keyframes', this.atrule.name)) {
          keyframeSelectors.push(selector)
          return this.skip
        }

        const [{ value: specificityObj }] = calculate(node)
        /** @type [number, number, number] */
        const specificity = [specificityObj.a, specificityObj.b, specificityObj.c]

        if (specificity[0] > 0) {
          ids.push(selector)
        }

        if (isAccessibility(node)) {
          a11y.push(selector)
        }

        let [complexity, isPrefixed] = getComplexity(node)

        if (isPrefixed) {
          prefixedSelectors.push(selector)
        }

        uniqueSelectors.add(selector)
        selectorComplexities.push(complexity)
        uniqueSpecificities.push(specificity[0] + ',' + specificity[1] + ',' + specificity[2])

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

      if (is_dimension(node_type)) {
        if (!this.declaration) {
          return
        }

        if (endsWith('\\9', node.unit)) {
          units.push(node.unit.substring(0, node.unit.length - 2), this.declaration.property)
        } else {
          units.push(node.unit, this.declaration.property)
        }

        return this.skip
      }

      if (is_url(node_type)) {
        if (startsWith('data:', node.value)) {
          var embed = node.value
          var size = embed.length
          var type = getEmbedType(embed)

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
        }
        return
      }

      if (is_value(node_type)) {
        if (isValueKeyword(node)) {
          return
        }

        const declaration = this.declaration
        const { property, important } = declaration

        if (isAstVendorPrefixed(node)) {
          vendorPrefixedValues.push(stringifyNode(node))
        }

        // i.e. `property: value !ie`
        if (typeof important === 'string') {
          valueBrowserhacks.push(stringifyNodePlain(node) + '!' + important)
        }

        // i.e. `property: value\9`
        if (isIe9Hack(node)) {
          valueBrowserhacks.push(stringifyNode(node))
        }

        // Process properties first that don't have colors,
        // so we can avoid further walking them;
        if (isProperty('z-index', property)) {
          if (!isValueKeyword(node)) {
            zindex.push(stringifyNode(node))
          }
          return
        } else if (isProperty('font', property)) {
          if (isFontKeyword(node)) return

          let { font_size, line_height, font_family } = destructure(node, stringifyNode)

          if (font_family) {
            fontFamilies.push(font_family)
          }
          if (font_size) {
            fontSizes.push(font_size)
          }
          if (line_height) {
            lineHeights.push(line_height)
          }
          return
        } else if (isProperty('font-size', property)) {
          if (!isFontKeyword(node)) {
            fontSizes.push(stringifyNode(node))
          }
          return
        } else if (isProperty('font-family', property)) {
          if (!isFontKeyword(node)) {
            fontFamilies.push(stringifyNode(node))
          }
          return
        } else if (isProperty('line-height', property)) {
          lineHeights.push((stringifyNode(node)))
          return
        } else if (isProperty('transition', property) || isProperty('animation', property)) {
          const [times, fns] = analyzeAnimation(node.children, stringifyNode)
          for (let i = 0; i < times.length; i++) {
            durations.push(times[i])
          }
          for (let i = 0; i < fns.length; i++) {
            timingFunctions.push(fns[i])
          }
          return
        } else if (isProperty('animation-duration', property) || isProperty('transition-duration', property)) {
          durations.push(stringifyNode(node))
          return
        } else if (isProperty('transition-timing-function', property) || isProperty('animation-timing-function', property)) {
          timingFunctions.push(stringifyNode(node))
          return
        } else if (isProperty('text-shadow', property)) {
          if (!isValueKeyword(node)) {
            textShadows.push(stringifyNode(node))
          }
          // no return here: potentially contains colors
        } else if (isProperty('box-shadow', property)) {
          if (!isValueKeyword(node)) {
            boxShadows.push(stringifyNode(node))
          }
          // no return here: potentially contains colors
        }

        walk(node, function (valueNode) {
          if (is_hash(valueNode.type)) {
            let hexLength = valueNode.value.length
            if (endsWith('\\9', valueNode.value)) {
              hexLength = hexLength - 2
            }
            colors.push('#' + valueNode.value, property)
            colorFormats.push(`hex` + hexLength)

            return this.skip
          }

          if (is_identifier(valueNode.type)) {
            const { name } = valueNode
            // Bail out if it can't be a color name
            // 20 === 'lightgoldenrodyellow'.length
            // 3 === 'red'.length
            if (name.length > 20 || name.length < 3) {
              return this.skip
            }
            const stringified = stringifyNode(valueNode)
            const lowerCased = name.toLowerCase()

            if (namedColors.has(lowerCased)) {
              colors.push(stringified, property)
              colorFormats.push('named')
              return
            }
            if (colorKeywords.has(lowerCased)) {
              colors.push(stringified, property)
              colorFormats.push(lowerCased)
              return
            }
            if (systemColors.has(lowerCased)) {
              colors.push(stringified, property)
              colorFormats.push('system')
              return
            }
            return this.skip
          }

          if (is_function(valueNode.type)) {
            // Don't walk var() multiple times
            if (strEquals('var', valueNode.name)) {
              return this.skip
            }
            const fnName = valueNode.name.toLowerCase()
            const stringified = stringifyNode(valueNode)
            if (colorFunctions.has(fnName)) {
              colors.push(stringified, property)
              colorFormats.push(fnName)
            }
            // No this.skip here intentionally,
            // otherwise we'll miss colors in linear-gradient() etc.
          }
        })
        return
      }

      if (is_declaration(node_type)) {
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

        const { property } = node

        // properties.push(property)

        // NEW NEW NEW NEW NEW NEW
        // replace end to only include the property, not the whole Declaration node
        node.loc.end.offset = node.loc.start.offset + node.property.length
        let tokens = createTokenArray(node)
        props.add(
          hashArray(tokens),
          tokens,
          interesting_nodes.add(node)
        )
        // END NEW END NEW END NEW

        if (hasVendorPrefix(property)) {
          propertyVendorPrefixes.push(property)
          propertyComplexities.push(2)
          return
        }
        if (isHack(property)) {
          propertyHacks.push(property)
          propertyComplexities.push(2)
          return
        }
        if (isCustom(property)) {
          customProperties.push(property)
          propertyComplexities.push(2)
          if (node.important === true) {
            importantCustomProperties.push(property)
          }
          return
        }

        propertyComplexities.push(1)
        return
      }
    })

  const totalUniqueDeclarations = uniqueDeclarations.size

  const totalSelectors = selectorComplexities.size()
  const specificitiesA = specificityA.aggregate()
  const specificitiesB = specificityB.aggregate()
  const specificitiesC = specificityC.aggregate()
  const uniqueSpecificitiesCount = uniqueSpecificities.count()
  const complexityCount = new CountableCollection(selectorComplexities.toArray()).count()
  const totalUniqueSelectors = uniqueSelectors.size
  const uniqueRuleSize = new CountableCollection(ruleSizes.toArray()).count()
  const uniqueSelectorsPerRule = new CountableCollection(selectorsPerRule.toArray()).count()
  const uniqueDeclarationsPerRule = new CountableCollection(declarationsPerRule.toArray()).count()
  const assign = Object.assign

  return {
    stylesheet: {
      sourceLinesOfCode: totalAtRules + totalSelectors + totalDeclarations + keyframeSelectors.size(),
      linesOfCode,
      size: css.length,
      comments: {
        total: totalComments,
        size: commentsSize,
      },
      embeddedContent: {
        total: embedTypes.total,
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
      },
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
      uniquenessRatio: ratio(totalUniqueSelectors, totalSelectors),
      specificity: {
        /** @type [number, number, number] */
        min: minSpecificity === undefined ? [0, 0, 0] : minSpecificity,
        /** @type [number, number, number] */
        max: maxSpecificity === undefined ? [0, 0, 0] : maxSpecificity,
        /** @type [number, number, number] */
        sum: [specificitiesA.sum, specificitiesB.sum, specificitiesC.sum],
        /** @type [number, number, number] */
        mean: [specificitiesA.mean, specificitiesB.mean, specificitiesC.mean],
        /** @type [number, number, number] */
        mode: [specificitiesA.mode, specificitiesB.mode, specificitiesC.mode],
        /** @type [number, number, number] */
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
      )
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
    properties: {
      total: props.total,
      totalUnique: props.total_unique,
      unique: ((function () {
        /** @type Map<string, Object> */
        let all = new Map()
        props.forEach((property) => {
          let p = stringify_index(property.items[0])
          all.set(p, property.count)
        })
        return Object.fromEntries(all)
      }))(),
      uniquenessRatio: ratio(props.total_unique, props.total),
      prefixed: {
        total: props.total_prefixed,
        totalUnique: props.total_unique_prefixed,
        unique: ((function () {
          /** @type Map<string, Object> */
          let all = new Map()
          props.forEach((property) => {
            if (property.is_prefixed) {
              let p = stringify_index(property.items[0])
              all.set(p, property.count)
            }
          })
          return Object.fromEntries(all)
        }))(),
        uniquenessRatio: ratio(props.total_unique_prefixed, props.total_prefixed),
        ratio: ratio(props.total_prefixed, props.total),
      },
      custom: assign(
        customProperties.count(),
        {
          ratio: ratio(customProperties.size(), props.total),
          importants: assign(
            importantCustomProperties.count(),
            {
              ratio: ratio(importantCustomProperties.size(), customProperties.size()),
            }
          ),
        },
      ),
      browserhacks: assign(
        propertyHacks.count(),
        {
          ratio: ratio(propertyHacks.size(), props.total),
        }
      ),
      complexity: propertyComplexities.aggregate(),
    },
    values: {
      colors: assign(
        colors.count(),
        {
          formats: colorFormats.count(),
        },
      ),
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
    }
  }
}

export {
  analyze,
  compareSpecificity,
}
