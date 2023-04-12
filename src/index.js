import parse from 'css-tree/parser'
import walk from 'css-tree/walker'
import { walkRules } from './rules/walk-rules.js'
import { compareSpecificity } from './selectors/utils.js'
import { walkSelectors } from './selectors/walk-selectors.js'
import { walkAtRules } from './atrules/atrules.js'
import { walkColors } from './values/colors.js'
import { destructure, isFontKeyword } from './values/destructure-font-shorthand.js'
import { isValueGlobalKeyword } from './values/values.js'
import { destructure_animation } from './values/animations.js'
import { isAstVendorPrefixed } from './values/vendor-prefix.js'
import { ContextCollection } from './context-collection.js'
import { CountableCollection } from './countable-collection.js'
import { AggregateCollection } from './aggregate-collection.js'
import { isProperty } from './properties/property-utils.js'
import { walkProperties } from './properties/properties.js'
import { walkEmbeds } from './stylesheet/stylesheet.js'
import { isIe9Hack } from './values/browserhacks.js'
import { walkUnits } from './values/units.js'
import { walkDeclarations } from './declarations/declarations.js'

/** @typedef {[number, number, number]} Specificity */

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
function analyze(css) {
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
  let embeds = new CountableCollection()
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
  /** @type {{[property: string]: string}[]} */
  let fontfaces = []
  let layers = new CountableCollection()
  let imports = new CountableCollection()
  let medias = new CountableCollection()
  let mediaBrowserhacks = new CountableCollection()
  let charsets = new CountableCollection()
  let supports = new CountableCollection()
  let supportsBrowserhacks = new CountableCollection()
  let keyframes = new CountableCollection()
  let prefixedKeyframes = new CountableCollection()
  let containers = new CountableCollection()

  // Rules
  let totalRules = 0
  let emptyRules = 0
  let ruleSizes = new AggregateCollection()
  let selectorsPerRule = new AggregateCollection()
  let declarationsPerRule = new AggregateCollection()

  // Selectors
  let keyframeSelectors = new CountableCollection()
  let uniqueSelectors = new Set()
  let prefixedSelectors = new CountableCollection()
  /** @type {Specificity} */
  let maxSpecificity
  /** @type {Specificity} */
  let minSpecificity
  let specificityA = new AggregateCollection()
  let specificityB = new AggregateCollection()
  let specificityC = new AggregateCollection()
  let uniqueSpecificities = new CountableCollection()
  let selectorComplexities = new AggregateCollection()
  /** @type {Specificity[]} */
  let specificities = []
  let ids = new CountableCollection()
  let a11y = new CountableCollection()

  // Declarations
  let uniqueDeclarations = new Set()
  let totalDeclarations = 0
  let importantDeclarations = 0
  let importantsInKeyframes = 0
  let importantCustomProperties = new CountableCollection()

  // Properties
  let properties = new CountableCollection()
  let propertyHacks = new CountableCollection()
  let propertyVendorPrefixes = new CountableCollection()
  let customProperties = new CountableCollection()
  let propertyComplexities = new AggregateCollection()

  // Values
  let vendorPrefixedValues = new CountableCollection()
  let valueBrowserhacks = new CountableCollection()
  let zindex = new CountableCollection()
  let textShadows = new CountableCollection()
  let boxShadows = new CountableCollection()
  let fontFamilies = new CountableCollection()
  let fontSizes = new CountableCollection()
  let lineHeights = new CountableCollection()
  let timingFunctions = new CountableCollection()
  let durations = new CountableCollection()
  let colors = new ContextCollection()
  let colorFormats = new CountableCollection()
  let units = new ContextCollection()

  walkEmbeds(ast, function ({ embed, size, type }) {
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

    embeds.push(embed)
  })

  walkAtRules(ast, stringifyNode, function (atrule) {
    totalAtRules++

    if (atrule.name === 'font-face') {
      fontfaces.push(atrule.descriptors)
      return
    }

    if (atrule.name === 'media') {
      let str = stringifyNode(atrule.node.prelude)
      medias.push(str)

      if (atrule.is_browserhack) {
        mediaBrowserhacks.push(str)
      }
      return
    }

    if (atrule.name === 'supports') {
      let str = stringifyNode(atrule.node.prelude)
      supports.push(str)

      if (atrule.is_browserhack) {
        supportsBrowserhacks.push(str)
      }
      return
    }

    if (atrule.name === 'keyframes') {
      keyframes.push(atrule.full_name)

      if (atrule.has_prefix) {
        prefixedKeyframes.push(atrule.full_name)
      }
      return
    }

    if (atrule.name === 'import') {
      imports.push(stringifyNode(atrule.node.prelude))
      return
    }

    if (atrule.name === 'charset') {
      charsets.push(stringifyNode(atrule.node.prelude))
      return
    }

    if (atrule.name === 'container') {
      containers.push(stringifyNode(atrule.node.prelude))
      return
    }

    if (atrule.name === 'layer') {
      atrule.layers.forEach(layer => layers.push(layer))
      return
    }
  })

  walkRules(ast, function (rule) {
    totalRules++
    ruleSizes.push(rule.size)
    selectorsPerRule.push(rule.selector_count)
    declarationsPerRule.push(rule.declaration_count)

    if (rule.declaration_count === 0) {
      emptyRules++
    }
  })

  walkSelectors(ast, function (selector) {
    let str = stringifyNode(selector.node)
    let specificity = selector.specificity

    if (selector.is_keyframe_selector) {
      keyframeSelectors.push(str)
      return
    }

    if (specificity[0] > 0) {
      ids.push(str)
    }

    if (selector.is_accesibility) {
      a11y.push(str)
    }

    if (selector.is_prefixed) {
      prefixedSelectors.push(str)
    }

    uniqueSelectors.add(str)
    selectorComplexities.push(selector.complexity)
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
  })

  walkDeclarations(ast, function (declaration) {
    totalDeclarations++
    uniqueDeclarations.add(stringifyNode(declaration.node))

    if (declaration.is_important) {
      importantDeclarations++

      if (declaration.is_in_keyframes) {
        importantsInKeyframes++
      }
    }
  })

  walkProperties(ast, function (property) {
    properties.push(property.property)
    propertyComplexities.push(property.complexity)

    if (property.is_browserhack) {
      propertyHacks.push(property.property)
    } else if (property.has_vendor_prefix) {
      propertyVendorPrefixes.push(property.property)
    } else if (property.is_custom) {
      customProperties.push(property.property)

      if (property.is_important) {
        importantCustomProperties.push(property.property)
      }
    }
  })

  walkColors(ast, stringifyNode, function (color) {
    colors.push(color.color, color.property)
    colorFormats.push(color.format)
  })

  walkUnits(ast, function (unit) {
    units.push(unit.unit, unit.property)
  })

  walk(ast, {
    visit: 'Declaration',
    /** @param {import('css-tree').Declaration} declaration */
    enter: function (declaration) {
      if (this.atrulePrelude !== null) {
        return this.skip
      }

      let { property, important, value } = declaration

      if (value.type === 'Raw') return

      if (isValueGlobalKeyword(value)) {
        return this.skip
      }

      if (isAstVendorPrefixed(value)) {
        vendorPrefixedValues.push(stringifyNode(value))
      }

      // i.e. `property: value !ie`
      if (typeof important === 'string') {
        valueBrowserhacks.push(stringifyNodePlain(value) + '!' + important)
      }

      // i.e. `property: value\9`
      if (isIe9Hack(value)) {
        valueBrowserhacks.push(stringifyNode(value))
      }

      // Process properties first that don't have colors,
      // so we can avoid further walking them;
      if (isProperty('z-index', property)) {
        zindex.push(stringifyNode(value))
      } else if (isProperty('font', property)) {
        if (isFontKeyword(value)) return

        let { font_size, line_height, font_family } = destructure(value, stringifyNode)

        if (font_family) {
          fontFamilies.push(font_family)
        }
        if (font_size) {
          fontSizes.push(font_size)
        }
        if (line_height) {
          lineHeights.push(line_height)
        }

      } else if (isProperty('font-size', property)) {
        if (!isFontKeyword(value)) {
          fontSizes.push(stringifyNode(value))
        }
      } else if (isProperty('font-family', property)) {
        if (!isFontKeyword(value)) {
          fontFamilies.push(stringifyNode(value))
        }
      } else if (isProperty('line-height', property)) {
        lineHeights.push((stringifyNode(value)))
      } else if (isProperty('transition', property) || isProperty('animation', property)) {
        let [times, fns] = destructure_animation(value.children)
        for (let i = 0; i < times.length; i++) {
          durations.push(stringifyNode(times[i]))
        }
        for (let i = 0; i < fns.length; i++) {
          timingFunctions.push(stringifyNode(fns[i]))
        }
      } else if (isProperty('animation-duration', property) || isProperty('transition-duration', property)) {
        durations.push(stringifyNode(value))
      } else if (isProperty('transition-timing-function', property) || isProperty('animation-timing-function', property)) {
        timingFunctions.push(stringifyNode(value))
      } else if (isProperty('text-shadow', property)) {
        textShadows.push(stringifyNode(value))
      } else if (isProperty('box-shadow', property)) {
        boxShadows.push(stringifyNode(value))
      }
    }
  })

  let embeddedContent = embeds.count()

  let totalUniqueDeclarations = uniqueDeclarations.size

  let totalSelectors = selectorComplexities.size()
  let specificitiesA = specificityA.aggregate()
  let specificitiesB = specificityB.aggregate()
  let specificitiesC = specificityC.aggregate()
  let uniqueSpecificitiesCount = uniqueSpecificities.count()
  let complexityCount = new CountableCollection(selectorComplexities.toArray()).count()
  let totalUniqueSelectors = uniqueSelectors.size
  let uniqueRuleSize = new CountableCollection(ruleSizes.toArray()).count()
  let uniqueSelectorsPerRule = new CountableCollection(selectorsPerRule.toArray()).count()
  let uniqueDeclarationsPerRule = new CountableCollection(declarationsPerRule.toArray()).count()
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

export {
  analyze,
  compareSpecificity,
}
