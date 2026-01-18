// Wallace parser for dual-parser migration
import {
	type CSSNode,
	is_custom,
	SKIP,
	str_equals,
	str_starts_with,
	tokenize,
	walk,
	parse,
	AT_RULE,
	BLOCK,
	DECLARATION,
	STYLE_RULE,
	SELECTOR_LIST,
	SELECTOR,
	URL,
	MEDIA_FEATURE,
	SUPPORTS_QUERY,
	LAYER_NAME,
	CONTAINER_QUERY,
	IDENTIFIER,
	OPERATOR,
	DIMENSION,
	FUNCTION,
	HASH,
	TOKEN_COMMENT,
} from '@projectwallace/css-parser'
import { isSupportsBrowserhack, isMediaBrowserhack } from './atrules/atrules.js'
import { getCombinators, getComplexity, isPrefixed, hasPseudoClass, isAccessibility } from './selectors/utils.js'
import { calculateForAST as calculateSpecificity } from './selectors/specificity.js'
import { colorFunctions, colorKeywords, namedColors, systemColors } from './values/colors.js'
import { destructure, SYSTEM_FONTS } from './values/destructure-font-shorthand.js'
import { keywords, isValueReset } from './values/values.js'
import { analyzeAnimation } from './values/animations.js'
import { isValuePrefixed } from './values/vendor-prefix.js'
import { ContextCollection } from './context-collection.js'
import { Collection, type Location } from './collection.js'
import { AggregateCollection } from './aggregate-collection.js'
import { endsWith, unquote } from './string-utils.js'
import { isProperty } from './properties/property-utils.js'
import { getEmbedType } from './stylesheet/stylesheet.js'
import { isIe9Hack } from './values/browserhacks.js'
import { basename } from './properties/property-utils.js'
import { KeywordSet } from './keyword-set.js'

export type Specificity = [number, number, number]

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

function ratio(part: number, total: number): number {
	if (total === 0) return 0
	return part / total
}

export type Options = {
	/** @description Use Locations (`{ 'item': [{ line, column, offset, length }] }`) instead of a regular count per occurrence (`{ 'item': 3 }`) */
	useLocations?: boolean
}

export function analyze(css: string, options?: Options & { useLocations?: false | undefined }): ReturnType<typeof analyzeInternal<false>>
export function analyze(css: string, options: Options & { useLocations: true }): ReturnType<typeof analyzeInternal<true>>
export function analyze(css: string, options: Options = {}): any {
	const useLocations = options.useLocations === true
	if (useLocations) {
		return analyzeInternal(css, options, true)
	}
	return analyzeInternal(css, options, false)
}

function analyzeInternal<T extends boolean>(css: string, options: Options, useLocations: T) {
	let start = Date.now()

	// Stylesheet
	let linesOfCode = (css.match(/\n/g) || []).length + 1
	let totalComments = 0
	let commentsSize = 0
	let embedSize = 0
	let embedTypes = {
		total: 0,
		unique: new Map() as Map<
			string,
			{
				size: number
				count: number
				uniqueWithLocations?: Location[]
			}
		>,
	}

	let startParse = Date.now()
	let ast = parse(css, {
		on_comment({ length }) {
			totalComments++
			// includes /* and */ in the size calculation
			commentsSize += length
		},
	})

	let startAnalysis = Date.now()

	// Atrules
	let atrules = new Collection(useLocations)
	let atRuleComplexities = new AggregateCollection()
	/** @type {Record<string, string>[]} */
	let fontfaces: Record<string, string>[] = []
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
	let atruleNesting = new AggregateCollection()
	let uniqueAtruleNesting = new Collection(useLocations)

	// Rules
	let totalRules = 0
	let emptyRules = 0
	let ruleSizes = new AggregateCollection()
	let selectorsPerRule = new AggregateCollection()
	let declarationsPerRule = new AggregateCollection()
	let uniqueRuleSize = new Collection(useLocations)
	let uniqueSelectorsPerRule = new Collection(useLocations)
	let uniqueDeclarationsPerRule = new Collection(useLocations)
	let ruleNesting = new AggregateCollection()
	let uniqueRuleNesting = new Collection(useLocations)

	// Selectors
	let keyframeSelectors = new Collection(useLocations)
	let uniqueSelectors = new Set()
	let prefixedSelectors = new Collection(useLocations)
	let maxSpecificity: Specificity | undefined
	let minSpecificity: Specificity | undefined
	let specificityA = new AggregateCollection()
	let specificityB = new AggregateCollection()
	let specificityC = new AggregateCollection()
	let uniqueSpecificities = new Collection(useLocations)
	let selectorComplexities = new AggregateCollection()
	let uniqueSelectorComplexities = new Collection(useLocations)
	let specificities: Specificity[] = []
	let ids = new Collection(useLocations)
	let a11y = new Collection(useLocations)
	let pseudoClasses = new Collection(useLocations)
	let combinators = new Collection(useLocations)
	let selectorNesting = new AggregateCollection()
	let uniqueSelectorNesting = new Collection(useLocations)

	// Declarations
	let uniqueDeclarations = new Set()
	let totalDeclarations = 0
	let declarationComplexities = new AggregateCollection()
	let importantDeclarations = 0
	let importantsInKeyframes = 0
	let importantCustomProperties = new Collection(useLocations)
	let declarationNesting = new AggregateCollection()
	let uniqueDeclarationNesting = new Collection(useLocations)

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
	let resets = new Collection(useLocations)

	function toLoc(node: CSSNode): Location {
		return {
			line: node.line,
			column: node.column,
			offset: node.start,
			length: node.length,
		}
	}

	// Track keyframes context by depth
	let keyframesDepth = -1

	walk(ast, (node, depth) => {
		// Reset keyframesDepth when we exit the keyframes block (at same or shallower depth)
		if (keyframesDepth >= 0 && depth <= keyframesDepth) {
			keyframesDepth = -1
		}

		// Check if we're inside a keyframes block
		let inKeyframes = keyframesDepth >= 0 && depth > keyframesDepth

		// Count nodes and track nesting
		if (node.type === AT_RULE) {
			let atruleLoc = toLoc(node)
			atruleNesting.push(depth)
			uniqueAtruleNesting.p(depth, atruleLoc)
			atrules.p(node.name, atruleLoc)

			//#region @FONT-FACE
			if (str_equals('font-face', node.name)) {
				let descriptors = Object.create(null)
				if (useLocations) {
					fontfaces_with_loc.p(node.start, toLoc(node))
				}
				let block = node.children.find((child: CSSNode) => child.type === BLOCK)
				for (let descriptor of block?.children || []) {
					if (descriptor.type === DECLARATION && descriptor.value) {
						descriptors[descriptor.property] = (descriptor.value as CSSNode).text
					}
				}
				atRuleComplexities.push(1)
				fontfaces.push(descriptors)
			}
			//#endregion

			if (node.prelude === null || node.prelude === undefined) {
				if (str_equals('layer', node.name)) {
					// @layer without a prelude is anonymous
					layers.p('<anonymous>', toLoc(node))
					atRuleComplexities.push(2)
				}
			} else {
				let { name } = node
				let complexity = 1

				// All the AtRules in here MUST have a prelude, so we can count their names
				if (str_equals('media', name)) {
					medias.p(node.prelude.text, toLoc(node))
					if (isMediaBrowserhack(node.prelude)) {
						mediaBrowserhacks.p(node.prelude.text, toLoc(node))
						complexity++
					}
				} else if (str_equals('supports', name)) {
					supports.p(node.prelude.text, toLoc(node))
					if (isSupportsBrowserhack(node.prelude)) {
						supportsBrowserhacks.p(node.prelude.text, toLoc(node))
						complexity++
					}
				} else if (endsWith('keyframes', name)) {
					let prelude = `@${name} ${node.prelude.text}`
					keyframes.p(prelude, toLoc(node))

					if (node.is_vendor_prefixed) {
						prefixedKeyframes.p(prelude, toLoc(node))
						complexity++
					}

					// Mark the depth at which we enter a keyframes atrule
					keyframesDepth = depth
				} else if (str_equals('layer', name)) {
					for (let layer of node.prelude.text.split(',').map((s: string) => s.trim())) {
						layers.p(layer, toLoc(node))
					}
				} else if (str_equals('import', name)) {
					imports.p(node.prelude.text, toLoc(node))

					if (node.prelude.has_children) {
						for (let child of node.prelude) {
							if (child.type === SUPPORTS_QUERY && typeof child.value === 'string') {
								supports.p(child.value, toLoc(child))
							} else if (child.type === LAYER_NAME && typeof child.value === 'string') {
								layers.p(child.value, toLoc(child))
							}
						}
					}
				} else if (str_equals('container', name)) {
					containers.p(node.prelude.text, toLoc(node))
					if (node.prelude.first_child?.type === CONTAINER_QUERY) {
						if (node.prelude.first_child.first_child?.type === IDENTIFIER) {
							containerNames.p(node.prelude.first_child.first_child.text, toLoc(node))
						}
					}
				} else if (str_equals('property', name)) {
					registeredProperties.p(node.prelude.text, toLoc(node))
				} else if (str_equals('charset', name)) {
					charsets.p(node.prelude.text, toLoc(node))
				}

				atRuleComplexities.push(complexity)
			}
		} else if (node.type === STYLE_RULE) {
			// Handle keyframe rules specially
			if (inKeyframes && node.prelude) {
				// In keyframes, the prelude is a SelectorList that may not have Selector children
				// (e.g., "50%" is just a SelectorList with text, no Selector child)
				if (node.prelude.type === SELECTOR_LIST && node.prelude.text) {
					keyframeSelectors.p(node.prelude.text, toLoc(node.prelude))
				}
				// Don't count keyframe rules as regular rules, but continue walking
				// children to count declarations inside keyframes
				// (Declarations are counted in the Declaration handler below)
			} else {
				// Only count non-keyframe rules
				totalRules++

				// Check if rule is empty (no declarations in block)
				if (node.block?.is_empty) {
					emptyRules++
				}

				// Count selectors and declarations in this rule
				let numSelectors = 0
				let numDeclarations = 0
				let loc = toLoc(node)

				// Find the SelectorList child and count Selector nodes inside it
				if (node.prelude) {
					for (const selector of node.prelude.children) {
						if (selector.type === SELECTOR) {
							numSelectors++
						}
					}
				}

				// Count declarations in the block
				if (node.block) {
					for (const declaration of node.block.children) {
						if (declaration.type === DECLARATION) {
							numDeclarations++
						}
					}
				}

				// Track rule metrics
				ruleSizes.push(numSelectors + numDeclarations)
				uniqueRuleSize.p(numSelectors + numDeclarations, loc)

				selectorsPerRule.push(numSelectors)
				uniqueSelectorsPerRule.p(numSelectors, loc)

				declarationsPerRule.push(numDeclarations)
				uniqueDeclarationsPerRule.p(numDeclarations, loc)

				ruleNesting.push(depth)
				uniqueRuleNesting.p(depth, loc)
			}
		} else if (node.type === SELECTOR) {
			// Keyframe selectors are now handled at the Rule level, so skip them here
			if (inKeyframes) {
				return SKIP
			}

			let loc = toLoc(node)

			selectorNesting.push(depth > 0 ? depth - 1 : 0)
			uniqueSelectorNesting.p(depth > 0 ? depth - 1 : 0, loc)
			uniqueSelectors.add(node.text)

			let complexity = getComplexity(node)
			selectorComplexities.push(complexity)
			uniqueSelectorComplexities.p(complexity, loc)

			if (isPrefixed(node)) {
				prefixedSelectors.p(node.text, loc)
			}

			// Check for accessibility selectors
			if (isAccessibility(node)) {
				a11y.p(node.text, loc)
			}

			let pseudos = hasPseudoClass(node)
			if (pseudos !== false) {
				for (let pseudo of pseudos) {
					pseudoClasses.p(pseudo, loc)
				}
			}

			getCombinators(node, function onCombinator(combinator) {
				let name = combinator.name.trim() === '' ? ' ' : combinator.name
				combinators.p(name, combinator.loc)
			})

			let specificity = calculateSpecificity(node)
			let [sa, sb, sc] = specificity

			uniqueSpecificities.p(specificity.toString(), loc)

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

			if (sa > 0) {
				ids.p(node.text, loc)
			}

			// Avoid deeper walking of selectors to not mess with
			// our specificity calculations in case of a selector
			// with :where() or :is() that contain SelectorLists
			// as children
			return SKIP
		} else if (node.type === DECLARATION) {
			totalDeclarations++
			uniqueDeclarations.add(node.text)

			let loc = toLoc(node)
			let declarationDepth = depth > 0 ? depth - 1 : 0
			declarationNesting.push(declarationDepth)
			uniqueDeclarationNesting.p(declarationDepth, loc)

			let complexity = 1
			if (node.is_important) {
				complexity++

				let declaration = node.text
				if (!declaration.toLowerCase().includes('!important')) {
					let valueText = (node.value as CSSNode).text
					let valueOffset = declaration.indexOf(valueText)
					let stripSemi = declaration.slice(-1) === ';'
					valueBrowserhacks.p(`${declaration.slice(valueOffset, stripSemi ? -1 : undefined)}`, toLoc(node.value as CSSNode))
				}

				if (inKeyframes) {
					importantsInKeyframes++
					complexity++
				}
			}
			declarationComplexities.push(complexity)

			//#region PROPERTIES
			let { is_important, property, is_browserhack, is_vendor_prefixed } = node

			let propertyLoc = toLoc(node)
			propertyLoc.length = property.length

			properties.p(property, propertyLoc)

			if (is_important) {
				importantDeclarations++
			}

			// Count important declarations
			if (is_vendor_prefixed) {
				propertyComplexities.push(2)
				propertyVendorPrefixes.p(property, propertyLoc)
			} else if (is_custom(property)) {
				customProperties.p(property, propertyLoc)
				propertyComplexities.push(is_important ? 3 : 2)

				if (is_important) {
					importantCustomProperties.p(property, propertyLoc)
				}
			} else if (is_browserhack) {
				propertyHacks.p(property, propertyLoc)
				propertyComplexities.push(2)
			} else {
				propertyComplexities.push(1)
			}
			//#endregion PROPERTIES

			//#region VALUES
			// Values are analyzed inside declaration because we need context, like which property is used
			{
				let value = node.value as CSSNode

				let { text } = value
				let valueLoc = toLoc(value)
				let complexity = 1

				// auto, inherit, initial, etc.
				if (keywords.has(text)) {
					valueKeywords.p(text, valueLoc)
					valueComplexities.push(complexity)
					return
				}

				//#region VALUE COMPLEXITY
				// i.e. `background-image: -webkit-linear-gradient()`
				if (isValuePrefixed(value)) {
					vendorPrefixedValues.p(value.text, valueLoc)
					complexity++
				}

				// i.e. `property: value\9`
				if (isIe9Hack(value)) {
					valueBrowserhacks.p(text, valueLoc)
					text = text.slice(0, -2)
					complexity++
				}
				//#endregion VALUE COMPLEXITY

				// TODO: should shorthands be counted towards complexity?
				valueComplexities.push(complexity)

				// Process properties first that don't have colors,
				// so we can avoid further walking them;
				if (
					isProperty('margin', property) ||
					isProperty('margin-block', property) ||
					isProperty('margin-inline', property) ||
					isProperty('margin-top', property) ||
					isProperty('margin-right', property) ||
					isProperty('margin-bottom', property) ||
					isProperty('margin-left', property) ||
					isProperty('padding', property) ||
					isProperty('padding-block', property) ||
					isProperty('padding-inline', property) ||
					isProperty('padding-top', property) ||
					isProperty('padding-right', property) ||
					isProperty('padding-bottom', property) ||
					isProperty('padding-left', property)
				) {
					if (isValueReset(value)) {
						resets.p(property, valueLoc)
					}
				} else if (isProperty('z-index', property)) {
					zindex.p(text, valueLoc)
					return SKIP
				} else if (isProperty('font', property)) {
					if (!SYSTEM_FONTS.has(text)) {
						let result = destructure(value, function (item) {
							if (item.type === 'keyword') {
								valueKeywords.p(item.value, valueLoc)
							}
						})

						if (!result) {
							return SKIP
						}

						let { font_size, line_height, font_family } = result
						if (font_family) {
							fontFamilies.p(font_family, valueLoc)
						}

						if (font_size) {
							fontSizes.p(font_size, valueLoc)
						}

						if (line_height) {
							lineHeights.p(line_height, valueLoc)
						}
					}
					// Don't return SKIP here - let walker continue to find
					// units, colors, and font families in var() fallbacks
				} else if (isProperty('font-size', property)) {
					if (!SYSTEM_FONTS.has(text)) {
						fontSizes.p(text, valueLoc)
					}
				} else if (isProperty('font-family', property)) {
					if (!SYSTEM_FONTS.has(text)) {
						fontFamilies.p(text, valueLoc)
					}
					return SKIP // to prevent finding color false positives (Black as font family name is not a color)
				} else if (isProperty('line-height', property)) {
					lineHeights.p(text, valueLoc)
				} else if (isProperty('transition', property) || isProperty('animation', property)) {
					analyzeAnimation(value.children, function (item: { type: string; value: CSSNode }) {
						if (item.type === 'fn') {
							timingFunctions.p(item.value.text, valueLoc)
						} else if (item.type === 'duration') {
							durations.p(item.value.text, valueLoc)
						} else if (item.type === 'keyword') {
							valueKeywords.p(item.value.text, valueLoc)
						}
					})
					return SKIP
				} else if (isProperty('animation-duration', property) || isProperty('transition-duration', property)) {
					for (let child of value.children) {
						if (child.type !== OPERATOR) {
							durations.p(child.text, valueLoc)
						}
					}
				} else if (isProperty('transition-timing-function', property) || isProperty('animation-timing-function', property)) {
					for (let child of value.children) {
						if (child.type !== OPERATOR) {
							timingFunctions.p(child.text, valueLoc)
						}
					}
				} else if (isProperty('container-name', property)) {
					containerNames.p(text, valueLoc)
				} else if (isProperty('container', property)) {
					// The first identifier in the `container` shorthand is the container name
					// Example: container: my-layout / inline-size;
					if (value.first_child?.type === IDENTIFIER) {
						containerNames.p(value.first_child.text, valueLoc)
					}
				} else if (border_radius_properties.has(basename(property))) {
					borderRadiuses.push(text, property, valueLoc)
				} else if (isProperty('text-shadow', property)) {
					textShadows.p(text, valueLoc)
				} else if (isProperty('box-shadow', property)) {
					boxShadows.p(text, valueLoc)
				}

				// Check if the value has an IE9 browserhack before walking
				let valueHasIe9Hack = isIe9Hack(value)

				walk(value, (valueNode) => {
					switch (valueNode.type) {
						case DIMENSION: {
							let unit = valueNode.unit!
							let loc = toLoc(valueNode)
							units.push(unit, property, loc)
							return SKIP
						}
						case HASH: {
							// Use text property for the hash value
							let hashText = valueNode.text
							if (!hashText || !hashText.startsWith('#')) {
								return SKIP
							}
							let hashValue = hashText

							// If the full value has an IE9 hack, append it to the hash
							if (valueHasIe9Hack && !hashValue.endsWith('\\9')) {
								hashValue = hashValue + '\\9'
							}

							// Calculate hex length (excluding the # and any IE9 browserhack \9)
							let hexLength = hashValue.length - 1 // Remove the # from length
							if (endsWith('\\9', hashValue)) {
								hexLength = hexLength - 2 // Remove the \9 from length
							}

							let hashLoc = toLoc(valueNode)
							colors.push(hashValue, property, hashLoc)
							colorFormats.p(`hex` + hexLength, hashLoc)

							return SKIP
						}
						case IDENTIFIER: {
							let identifierText = valueNode.text
							let identifierLoc = toLoc(valueNode)

							// Skip all identifier processing for font properties to avoid:
							// 1. False positives for colors (e.g., "Black" as a font family vs. "black" the color)
							// 2. Duplicate keywords (already extracted by destructure function)
							if (isProperty('font', property) || isProperty('font-family', property)) {
								return SKIP
							}

							if (keywords.has(identifierText)) {
								valueKeywords.p(identifierText, identifierLoc)
							}

							// Bail out if it can't be a color name
							// 20 === 'lightgoldenrodyellow'.length
							// 3 === 'red'.length
							let nodeLen = identifierText.length
							if (nodeLen > 20 || nodeLen < 3) {
								return SKIP
							}

							// A keyword is most likely to be 'transparent' or 'currentColor'
							if (colorKeywords.has(identifierText)) {
								colors.push(identifierText, property, identifierLoc)
								colorFormats.p(identifierText.toLowerCase(), identifierLoc)
								return
							}

							// Or it can be a named color
							if (namedColors.has(identifierText)) {
								colors.push(identifierText, property, identifierLoc)
								colorFormats.p('named', identifierLoc)
								return
							}

							// Or it can be a system color
							if (systemColors.has(identifierText)) {
								colors.push(identifierText, property, identifierLoc)
								colorFormats.p('system', identifierLoc)
								return
							}
							return SKIP
						}
						case FUNCTION: {
							let funcName = valueNode.name as string
							let funcLoc = toLoc(valueNode)

							// rgb(a), hsl(a), color(), hwb(), lch(), lab(), oklab(), oklch()
							if (colorFunctions.has(funcName)) {
								colors.push(valueNode.text, property, funcLoc)
								colorFormats.p(funcName.toLowerCase(), funcLoc)
								return
							}

							if (endsWith('gradient', funcName)) {
								gradients.p(valueNode.text, funcLoc)
								return
							}
							// No SKIP here intentionally,
							// otherwise we'll miss colors in linear-gradient(), var() fallbacks, etc.
						}
					}
				})
			}
			//#endregion VALUES
		} else if (node.type === URL) {
			let { value } = node
			let embed = unquote((value as string) || '')
			if (str_starts_with(embed, 'data:')) {
				let size = embed.length
				let type = getEmbedType(embed)

				embedTypes.total++
				embedSize += size

				let loc = {
					line: node.line,
					column: node.column,
					offset: node.start,
					length: node.length,
				}

				if (embedTypes.unique.has(type)) {
					let item = embedTypes.unique.get(type)!
					item.count++
					item.size += size
					embedTypes.unique.set(type, item)
					if (useLocations && item.uniqueWithLocations) {
						item.uniqueWithLocations.push(loc)
					}
				} else {
					let item = {
						count: 1,
						size,
						uniqueWithLocations: useLocations ? [loc] : undefined,
					}
					embedTypes.unique.set(type, item)
				}
			}
		} else if (node.type === MEDIA_FEATURE) {
			// console.log({ Feature: node.text, name: node.name, value: node.value })
			mediaFeatures.p(node.name, toLoc(node))
			return SKIP
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
	let atruleCount = atrules.c()

	return {
		stylesheet: {
			sourceLinesOfCode: atruleCount.total + totalSelectors + totalDeclarations + keyframeSelectors.size(),
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
		atrules: assign(atruleCount, {
			fontface: assign(
				{
					total: fontFacesCount,
					totalUnique: fontFacesCount,
					unique: fontfaces,
					uniquenessRatio: fontFacesCount === 0 ? 0 : 1,
				},
				useLocations
					? {
							uniqueWithLocations: fontfaces_with_loc.c().uniqueWithLocations,
						}
					: {},
			),
			import: imports.c(),
			media: assign(medias.c(), {
				browserhacks: mediaBrowserhacks.c(),
				features: mediaFeatures.c(),
			}),
			charset: charsets.c(),
			supports: assign(supports.c(), {
				browserhacks: supportsBrowserhacks.c(),
			}),
			keyframes: assign(keyframes.c(), {
				prefixed: assign(prefixedKeyframes.c(), {
					ratio: ratio(prefixedKeyframes.size(), keyframes.size()),
				}),
			}),
			container: assign(containers.c(), {
				names: containerNames.c(),
			}),
			layer: layers.c(),
			property: registeredProperties.c(),
			complexity: atRuleComplexity,
			nesting: assign(
				atruleNesting.aggregate(),
				{
					items: atruleNesting.toArray(),
				},
				uniqueAtruleNesting.c(),
			),
		}),
		rules: {
			total: totalRules,
			empty: {
				total: emptyRules,
				ratio: ratio(emptyRules, totalRules),
			},
			sizes: assign(
				ruleSizes.aggregate(),
				{
					items: ruleSizes.toArray(),
				},
				uniqueRuleSize.c(),
			),
			nesting: assign(
				ruleNesting.aggregate(),
				{
					items: ruleNesting.toArray(),
				},
				uniqueRuleNesting.c(),
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
			complexity: assign(selectorComplexity, uniqueSelectorComplexities.c(), {
				items: selectorComplexities.toArray(),
			}),
			nesting: assign(
				selectorNesting.aggregate(),
				{
					items: selectorNesting.toArray(),
				},
				uniqueSelectorNesting.c(),
			),
			id: assign(ids.c(), {
				ratio: ratio(ids.size(), totalSelectors),
			}),
			pseudoClasses: pseudoClasses.c(),
			accessibility: assign(a11y.c(), {
				ratio: ratio(a11y.size(), totalSelectors),
			}),
			keyframes: keyframeSelectors.c(),
			prefixed: assign(prefixedSelectors.c(), {
				ratio: ratio(prefixedSelectors.size(), totalSelectors),
			}),
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
			nesting: assign(
				declarationNesting.aggregate(),
				{
					items: declarationNesting.toArray(),
				},
				uniqueDeclarationNesting.c(),
			),
		},
		properties: assign(properties.c(), {
			prefixed: assign(propertyVendorPrefixes.c(), {
				ratio: ratio(propertyVendorPrefixes.size(), properties.size()),
			}),
			custom: assign(customProperties.c(), {
				ratio: ratio(customProperties.size(), properties.size()),
				importants: assign(importantCustomProperties.c(), {
					ratio: ratio(importantCustomProperties.size(), customProperties.size()),
				}),
			}),
			browserhacks: assign(propertyHacks.c(), {
				ratio: ratio(propertyHacks.size(), properties.size()),
			}),
			complexity: propertyComplexity,
		}),
		values: {
			colors: assign(colors.count(), {
				formats: colorFormats.c(),
			}),
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
			resets: resets.c(),
		},
		__meta__: {
			parseTime: startAnalysis - startParse,
			analyzeTime: Date.now() - startAnalysis,
			total: Date.now() - start,
		},
	}
}

/**
 * Compare specificity A to Specificity B
 * @returns 0 when a==b, 1 when a<b, -1 when a>b
 */
export function compareSpecificity(a: Specificity, b: Specificity): number {
	if (a[0] === b[0]) {
		if (a[1] === b[1]) {
			return b[2] - a[2]
		}

		return b[1] - a[1]
	}

	return b[0] - a[0]
}

export { calculate as calculateSpecificity } from './selectors/specificity.js'

export {
	getComplexity as selectorComplexity,
	isPrefixed as isSelectorPrefixed,
	isAccessibility as isAccessibilitySelector,
} from './selectors/utils.js'

export { isSupportsBrowserhack, isMediaBrowserhack } from './atrules/atrules.js'

export { isHack as isPropertyHack } from './properties/property-utils.js'

export { isValuePrefixed } from './values/vendor-prefix.js'

export { colorFunctions, colorKeywords, namedColors, systemColors } from './values/colors.js'

export { keywords as cssKeywords } from './values/values.js'

export { hasVendorPrefix } from './vendor-prefix.js'

export { KeywordSet } from './keyword-set.js'

export type { Location, UniqueWithLocations } from './collection.js'
