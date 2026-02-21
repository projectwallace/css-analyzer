// Wallace parser for dual-parser migration
import {
	type CSSNode,
	is_custom,
	SKIP,
	str_starts_with,
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
	ATTRIBUTE_SELECTOR,
} from '@projectwallace/css-parser'
import { isSupportsBrowserhack, isMediaBrowserhack } from './atrules/atrules.js'
import { getCombinators, getComplexity, isPrefixed, hasPseudoClass, isAccessibility, hasPseudoElement } from './selectors/utils.js'
import { calculateForAST as calculateSpecificity } from './selectors/specificity.js'
import { colorFunctions, colorKeywords, namedColors, systemColors } from './values/colors.js'
import { destructure, SYSTEM_FONTS } from './values/destructure-font-shorthand.js'
import { keywords, isValueReset } from './values/values.js'
import { analyzeAnimation } from './values/animations.js'
import { isValuePrefixed } from './values/vendor-prefix.js'
import { ContextCollection } from './context-collection.js'
import { Collection, type Location, type UniqueWithLocations } from './collection.js'
import { AggregateCollection } from './aggregate-collection.js'
import { endsWith, unquote } from './string-utils.js'
import { getEmbedType } from './stylesheet/stylesheet.js'
import { isIe9Hack } from './values/browserhacks.js'
import { basename, SPACING_RESET_PROPERTIES, border_radius_properties } from './properties/property-utils.js'
import { type Options, shouldRun } from './options.js'

export type Specificity = [number, number, number]

function ratio(part: number, total: number): number {
	if (total === 0) return 0
	return part / total
}

// Re-export Options for external consumers
export type { Options }

export function analyze(css: string, options?: Options): ReturnType<typeof analyzeInternal>
export function analyze(css: string, options: Options = {}): any {
	return analyzeInternal(css, options)
}

function analyzeInternal(css: string, options: Options) {
	let start = Date.now()

	const useLocations = options.locations === true || options.useLocations === true
	const samples = options.samples === true
	const only = options.only

	// Precompute which metric groups to run
	const runStylesheet = shouldRun(only, 'stylesheet')
	const runAtrules = shouldRun(only, 'atrules')
	const runRules = shouldRun(only, 'rules')
	const runSelectors = shouldRun(only, 'selectors')
	const runDeclarations = shouldRun(only, 'declarations')
	const runProperties = shouldRun(only, 'properties')
	const runValues = shouldRun(only, 'values')

	// Sub-metric flags
	const runSelectors_specificity = shouldRun(only, 'selectors.specificity')
	const runSelectors_complexity = shouldRun(only, 'selectors.complexity')
	const runSelectors_id = shouldRun(only, 'selectors.id')
	const runSelectors_pseudoClasses = shouldRun(only, 'selectors.pseudoClasses')
	const runSelectors_pseudoElements = shouldRun(only, 'selectors.pseudoElements')
	const runSelectors_a11y = shouldRun(only, 'selectors.accessibility')
	const runSelectors_attributes = shouldRun(only, 'selectors.attributes')
	const runSelectors_combinators = shouldRun(only, 'selectors.combinators')
	const runSelectors_nesting = shouldRun(only, 'selectors.nesting')
	const runSelectors_keyframes = shouldRun(only, 'selectors.keyframes')
	const runSelectors_prefixed = shouldRun(only, 'selectors.prefixed')

	const runValues_colors = shouldRun(only, 'values.colors')
	const runValues_gradients = shouldRun(only, 'values.gradients')
	const runValues_fontFamilies = shouldRun(only, 'values.fontFamilies')
	const runValues_fontSizes = shouldRun(only, 'values.fontSizes')
	const runValues_lineHeights = shouldRun(only, 'values.lineHeights')
	const runValues_zindexes = shouldRun(only, 'values.zindexes')
	const runValues_textShadows = shouldRun(only, 'values.textShadows')
	const runValues_boxShadows = shouldRun(only, 'values.boxShadows')
	const runValues_borderRadiuses = shouldRun(only, 'values.borderRadiuses')
	const runValues_animations = shouldRun(only, 'values.animations')
	const runValues_prefixes = shouldRun(only, 'values.prefixes')
	const runValues_browserhacks = shouldRun(only, 'values.browserhacks')
	const runValues_units = shouldRun(only, 'values.units')
	const runValues_keywords = shouldRun(only, 'values.keywords')
	const runValues_resets = shouldRun(only, 'values.resets')
	const runValues_displays = shouldRun(only, 'values.displays')

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
				locations?: Location[]
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
	let atRuleComplexities = new AggregateCollection(samples)
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
	let scopes = new Collection(useLocations)
	let atruleNesting = new AggregateCollection(samples)
	let uniqueAtruleNesting = new Collection(useLocations)

	// Rules
	let totalRules = 0
	let emptyRules = 0
	let ruleSizes = new AggregateCollection(samples)
	let selectorsPerRule = new AggregateCollection(samples)
	let declarationsPerRule = new AggregateCollection(samples)
	let uniqueRuleSize = new Collection(useLocations)
	let uniqueSelectorsPerRule = new Collection(useLocations)
	let uniqueDeclarationsPerRule = new Collection(useLocations)
	let ruleNesting = new AggregateCollection(samples)
	let uniqueRuleNesting = new Collection(useLocations)

	// Selectors
	let keyframeSelectors = new Collection(useLocations)
	let uniqueSelectors = new Set()
	let prefixedSelectors = new Collection(useLocations)
	let maxSpecificity: Specificity | undefined
	let minSpecificity: Specificity | undefined
	let specificityA = new AggregateCollection(samples)
	let specificityB = new AggregateCollection(samples)
	let specificityC = new AggregateCollection(samples)
	let uniqueSpecificities = new Collection(useLocations)
	let selectorComplexities = new AggregateCollection(samples)
	let uniqueSelectorComplexities = new Collection(useLocations)
	let specificities: Specificity[] = []
	let ids = new Collection(useLocations)
	let a11y = new Collection(useLocations)
	let pseudoClasses = new Collection(useLocations)
	let pseudoElements = new Collection(useLocations)
	let attributeSelectors = new Collection(useLocations)
	let combinators = new Collection(useLocations)
	let selectorNesting = new AggregateCollection(samples)
	let uniqueSelectorNesting = new Collection(useLocations)

	// Declarations
	let uniqueDeclarations = new Set()
	let totalDeclarations = 0
	let declarationComplexities = new AggregateCollection(samples)
	let importantDeclarations = 0
	let importantsInKeyframes = 0
	let importantCustomProperties = new Collection(useLocations)
	let declarationNesting = new AggregateCollection(samples)
	let uniqueDeclarationNesting = new Collection(useLocations)

	// Properties
	let properties = new Collection(useLocations)
	let propertyHacks = new Collection(useLocations)
	let propertyVendorPrefixes = new Collection(useLocations)
	let customProperties = new Collection(useLocations)
	let propertyComplexities = new AggregateCollection(samples)

	// Values
	let valueComplexities = new AggregateCollection(samples)
	let vendorPrefixedValues = new Collection(useLocations)
	let valueBrowserhacks = new Collection(useLocations)
	let displays = new Collection(useLocations)
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
			if (!runAtrules) return SKIP

			let atruleLoc = toLoc(node)
			atruleNesting.push(depth)
			uniqueAtruleNesting.p(depth, atruleLoc)
			let normalized_name = basename(node.name ?? '')
			atrules.p(normalized_name, atruleLoc)

			//#region @FONT-FACE
			if (normalized_name === 'font-face') {
				let descriptors = Object.create(null)
				if (useLocations) {
					fontfaces_with_loc.p(node.start, toLoc(node))
				}
				let block = node.children.find((child: CSSNode) => child.type === BLOCK)
				for (let descriptor of block?.children || []) {
					if (descriptor.type === DECLARATION && descriptor.value) {
						descriptors[descriptor.property!] = (descriptor.value as CSSNode).text
					}
				}
				atRuleComplexities.push(1)
				fontfaces.push(descriptors)
			}
			//#endregion

			if (node.prelude === null || node.prelude === undefined) {
				if (normalized_name === 'layer') {
					// @layer without a prelude is anonymous
					layers.p('<anonymous>', toLoc(node))
					atRuleComplexities.push(2)
				}
			} else {
				let complexity = 1

				// All the AtRules in here MUST have a prelude, so we can count their names
				if (normalized_name === 'media') {
					medias.p(node.prelude.text, toLoc(node))
					isMediaBrowserhack(node.prelude, (hack) => {
						mediaBrowserhacks.p(hack, toLoc(node))
						complexity++
					})
				} else if (normalized_name === 'supports') {
					supports.p(node.prelude.text, toLoc(node))

					isSupportsBrowserhack(node.prelude, (hack) => {
						supportsBrowserhacks.p(hack, toLoc(node))
						complexity++
					})
				} else if (normalized_name.endsWith('keyframes')) {
					let prelude = node.prelude.text
					keyframes.p(prelude, toLoc(node))

					if (node.is_vendor_prefixed) {
						prefixedKeyframes.p(`@${node.name?.toLowerCase()} ${node.prelude.text}`, toLoc(node))
						complexity++
					}

					// Mark the depth at which we enter a keyframes atrule
					keyframesDepth = depth
				} else if (normalized_name === 'layer') {
					for (let layer of node.prelude.text.split(',').map((s: string) => s.trim())) {
						layers.p(layer, toLoc(node))
					}
				} else if (normalized_name === 'import') {
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
				} else if (normalized_name === 'container') {
					containers.p(node.prelude.text, toLoc(node))
					if (node.prelude.first_child?.type === CONTAINER_QUERY) {
						if (node.prelude.first_child.first_child?.type === IDENTIFIER) {
							containerNames.p(node.prelude.first_child.first_child.text, toLoc(node))
						}
					}
				} else if (normalized_name === 'property') {
					registeredProperties.p(node.prelude.text, toLoc(node))
				} else if (normalized_name === 'charset') {
					charsets.p(node.prelude.text.toLowerCase(), toLoc(node))
				} else if (normalized_name === 'scope') {
					scopes.p(node.prelude.text, toLoc(node))
				}

				atRuleComplexities.push(complexity)
			}
		} else if (node.type === STYLE_RULE) {
			// Handle keyframe rules specially
			if (inKeyframes && node.prelude) {
				if (runSelectors && runSelectors_keyframes && node.prelude.type === SELECTOR_LIST && node.prelude.children.length > 0) {
					for (let keyframe_selector of node.prelude.children) {
						keyframeSelectors.p(keyframe_selector.text, toLoc(keyframe_selector))
					}
				}
				// Don't count keyframe rules as regular rules, but continue walking
				// children to count declarations inside keyframes
				// (Declarations are counted in the Declaration handler below)
			} else if (runRules) {
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

			if (!runSelectors) return SKIP

			let loc = toLoc(node)

			if (runSelectors_nesting) {
				selectorNesting.push(depth > 0 ? depth - 1 : 0)
				uniqueSelectorNesting.p(depth > 0 ? depth - 1 : 0, loc)
			}

			uniqueSelectors.add(node.text)

			if (runSelectors_complexity) {
				let complexity = getComplexity(node)
				selectorComplexities.push(complexity)
				uniqueSelectorComplexities.p(complexity, loc)
			}

			if (runSelectors_prefixed) {
				isPrefixed(node, (prefix) => {
					prefixedSelectors.p(prefix.toLowerCase(), loc)
				})
			}

			if (runSelectors_a11y) {
				// Check for accessibility selectors
				isAccessibility(node, (a11y_selector) => {
					a11y.p(a11y_selector, loc)
				})
			}

			if (runSelectors_pseudoClasses) {
				hasPseudoClass(node, (pseudo) => {
					pseudoClasses.p(pseudo.toLowerCase(), loc)
				})
			}

			if (runSelectors_pseudoElements) {
				hasPseudoElement(node, (pseudo) => {
					pseudoElements.p(pseudo.toLowerCase(), loc)
				})
			}

			if (runSelectors_attributes) {
				walk(node, (child) => {
					if (child.type === ATTRIBUTE_SELECTOR) {
						attributeSelectors.p(child.name?.toLowerCase() ?? '', loc)
					}
				})
			}

			if (runSelectors_combinators) {
				getCombinators(node, (combinator) => {
					let name = combinator.name.trim() === '' ? ' ' : combinator.name
					combinators.p(name, combinator.loc)
				})
			}

			if (runSelectors_specificity) {
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

				if (samples) {
					specificities.push(specificity)
				}

				if (runSelectors_id && sa > 0) {
					ids.p(node.text, loc)
				}
			} else if (runSelectors_id) {
				// Still need specificity for ID detection even if we're not running full specificity
				let specificity = calculateSpecificity(node)
				if (specificity[0] > 0) {
					ids.p(node.text, loc)
				}
			}

			// Avoid deeper walking of selectors to not mess with
			// our specificity calculations in case of a selector
			// with :where() or :is() that contain SelectorLists
			// as children
			return SKIP
		} else if (node.type === DECLARATION) {
			if (!runDeclarations && !runProperties && !runValues) return

			totalDeclarations++
			uniqueDeclarations.add(node.text)

			let loc = toLoc(node)
			let declarationDepth = depth > 0 ? depth - 1 : 0

			if (runDeclarations) {
				declarationNesting.push(declarationDepth)
				uniqueDeclarationNesting.p(declarationDepth, loc)

				let complexity = 1
				if (node.is_important) {
					complexity++

					let declaration = node.text
					if (!declaration.toLowerCase().includes('!important')) {
						if (runValues_browserhacks) valueBrowserhacks.p('!ie', toLoc(node.value as CSSNode))
					}

					if (inKeyframes) {
						importantsInKeyframes++
						complexity++
					}
				}
				declarationComplexities.push(complexity)
			}

			if (node.is_important && runDeclarations) {
				importantDeclarations++
			}

			//#region PROPERTIES
			let { is_important, property, is_browserhack, is_vendor_prefixed } = node

			if (!property) return

			let propertyLoc = toLoc(node)
			propertyLoc.length = property.length
			let normalizedProperty = basename(property)

			if (runProperties) {
				properties.p(normalizedProperty, propertyLoc)

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
					propertyHacks.p(property.charAt(0), propertyLoc)
					propertyComplexities.push(2)
				} else {
					propertyComplexities.push(1)
				}
			}
			//#endregion PROPERTIES

			if (!runValues) return

			//#region VALUES
			// Values are analyzed inside declaration because we need context, like which property is used
			{
				let value = node.value as CSSNode

				let { text } = value
				let valueLoc = toLoc(value)
				let complexity = 1

				// auto, inherit, initial, none, etc.
				if (keywords.has(text)) {
					if (runValues_keywords) valueKeywords.p(text.toLowerCase(), valueLoc)
					valueComplexities.push(complexity)

					if (runValues_displays && normalizedProperty === 'display') {
						displays.p(text.toLowerCase(), valueLoc)
					}

					return
				}

				//#region VALUE COMPLEXITY
				// i.e. `background-image: -webkit-linear-gradient()`
				if (runValues_prefixes) {
					isValuePrefixed(value, (prefixed) => {
						vendorPrefixedValues.p(prefixed.toLowerCase(), valueLoc)
						complexity++
					})
				} else {
					isValuePrefixed(value, () => {
						complexity++
					})
				}

				// i.e. `property: value\9`
				if (isIe9Hack(value)) {
					if (runValues_browserhacks) valueBrowserhacks.p('\\9', valueLoc)
					text = text.slice(0, -2)
					complexity++
				}
				//#endregion VALUE COMPLEXITY

				// TODO: should shorthands be counted towards complexity?
				valueComplexities.push(complexity)

				// Process properties first that don't have colors,
				// so we can avoid further walking them;
				if (runValues_resets && SPACING_RESET_PROPERTIES.has(normalizedProperty)) {
					if (isValueReset(value)) {
						resets.p(normalizedProperty, valueLoc)
					}
				} else if (runValues_displays && normalizedProperty === 'display') {
					if (/var\(/i.test(text)) {
						displays.p(text, valueLoc)
					} else {
						displays.p(text.toLowerCase(), valueLoc)
					}
				} else if (runValues_zindexes && normalizedProperty === 'z-index') {
					zindex.p(text, valueLoc)
					return SKIP
				} else if (normalizedProperty === 'font') {
					if (!SYSTEM_FONTS.has(text)) {
						let result = destructure(value, function (item) {
							if (item.type === 'keyword' && runValues_keywords) {
								valueKeywords.p(item.value.toLowerCase(), valueLoc)
							}
						})

						if (!result) {
							return SKIP
						}

						let { font_size, line_height, font_family } = result
						if (font_family && runValues_fontFamilies) {
							fontFamilies.p(font_family, valueLoc)
						}

						if (font_size && runValues_fontSizes) {
							fontSizes.p(font_size.toLowerCase(), valueLoc)
						}

						if (line_height && runValues_lineHeights) {
							lineHeights.p(line_height.toLowerCase(), valueLoc)
						}
					}
					// Don't return SKIP here - let walker continue to find
					// units, colors, and font families in var() fallbacks
				} else if (runValues_fontSizes && normalizedProperty === 'font-size') {
					if (!SYSTEM_FONTS.has(text)) {
						let normalized = text.toLowerCase()
						if (normalized.includes('var(')) {
							fontSizes.p(text, valueLoc)
						} else {
							fontSizes.p(normalized, valueLoc)
						}
					}
				} else if (normalizedProperty === 'font-family') {
					if (runValues_fontFamilies && !SYSTEM_FONTS.has(text)) {
						fontFamilies.p(text, valueLoc)
					}
					return SKIP // to prevent finding color false positives (Black as font family name is not a color)
				} else if (runValues_lineHeights && normalizedProperty === 'line-height') {
					let normalized = text.toLowerCase()
					if (normalized.includes('var(')) {
						lineHeights.p(text, valueLoc)
					} else {
						lineHeights.p(normalized, valueLoc)
					}
				} else if (runValues_animations && (normalizedProperty === 'transition' || normalizedProperty === 'animation')) {
					analyzeAnimation(value.children, function (item) {
						if (item.type === 'fn') {
							timingFunctions.p(item.value.text.toLowerCase(), valueLoc)
						} else if (item.type === 'duration') {
							durations.p(item.value.text.toLowerCase(), valueLoc)
						} else if (item.type === 'keyword' && runValues_keywords) {
							valueKeywords.p(item.value.text.toLowerCase(), valueLoc)
						}
					})
					return SKIP
				} else if (runValues_animations && (normalizedProperty === 'animation-duration' || normalizedProperty === 'transition-duration')) {
					for (let child of value.children) {
						if (child.type !== OPERATOR) {
							let text = child.text
							if (/var\(/i.test(text)) {
								durations.p(text, valueLoc)
							} else {
								durations.p(text.toLowerCase(), valueLoc)
							}
						}
					}
				} else if (runValues_animations && (normalizedProperty === 'transition-timing-function' || normalizedProperty === 'animation-timing-function')) {
					for (let child of value.children) {
						if (child.type !== OPERATOR) {
							timingFunctions.p(child.text, valueLoc)
						}
					}
				} else if (normalizedProperty === 'container-name') {
					containerNames.p(text, valueLoc)
				} else if (normalizedProperty === 'container') {
					// The first identifier in the `container` shorthand is the container name
					// Example: container: my-layout / inline-size;
					if (value.first_child?.type === IDENTIFIER) {
						containerNames.p(value.first_child.text, valueLoc)
					}
				} else if (runValues_borderRadiuses && border_radius_properties.has(normalizedProperty)) {
					borderRadiuses.push(text, property, valueLoc)
				} else if (runValues_textShadows && normalizedProperty === 'text-shadow') {
					textShadows.p(text, valueLoc)
				} else if (runValues_boxShadows && normalizedProperty === 'box-shadow') {
					boxShadows.p(text, valueLoc)
				}

				// Check if the value has an IE9 browserhack before walking
				let valueHasIe9Hack = isIe9Hack(value)

				walk(value, (valueNode) => {
					switch (valueNode.type) {
						case DIMENSION: {
							if (!runValues_units) return SKIP
							let unit = valueNode.unit?.toLowerCase() ?? ''
							let loc = toLoc(valueNode)
							units.push(unit, property, loc)
							return SKIP
						}
						case HASH: {
							if (!runValues_colors) return SKIP
							// Use text property for the hash value
							let hashText = valueNode.text
							if (!hashText || !hashText.startsWith('#')) {
								return SKIP
							}
							let hashValue = hashText.toLowerCase()

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
							if (normalizedProperty === 'font' || normalizedProperty === 'font-family') {
								return SKIP
							}

							if (runValues_keywords && keywords.has(identifierText)) {
								valueKeywords.p(identifierText.toLowerCase(), identifierLoc)
							}

							if (!runValues_colors) return SKIP

							// Bail out if it can't be a color name
							// 20 === 'lightgoldenrodyellow'.length
							// 3 === 'red'.length
							let nodeLen = identifierText.length
							if (nodeLen > 20 || nodeLen < 3) {
								return SKIP
							}

							// A keyword is most likely to be 'transparent' or 'currentColor'
							if (colorKeywords.has(identifierText)) {
								let colorKeyword = identifierText.toLowerCase()
								colors.push(colorKeyword, property, identifierLoc)
								colorFormats.p(colorKeyword, identifierLoc)
								return
							}

							// Or it can be a named color
							if (namedColors.has(identifierText)) {
								colors.push(identifierText.toLowerCase(), property, identifierLoc)
								colorFormats.p('named', identifierLoc)
								return
							}

							// Or it can be a system color
							if (systemColors.has(identifierText)) {
								colors.push(identifierText.toLowerCase(), property, identifierLoc)
								colorFormats.p('system', identifierLoc)
								return
							}
							return SKIP
						}
						case FUNCTION: {
							let funcName = valueNode.name as string
							let funcLoc = toLoc(valueNode)

							// rgb(a), hsl(a), color(), hwb(), lch(), lab(), oklab(), oklch()
							if (runValues_colors && colorFunctions.has(funcName)) {
								colors.push(valueNode.text, property, funcLoc)
								colorFormats.p(funcName.toLowerCase(), funcLoc)
								return
							}

							if (runValues_gradients && endsWith('gradient', funcName)) {
								gradients.p(valueNode.text, funcLoc)
							}
							// No SKIP here intentionally,
							// otherwise we'll miss colors in linear-gradient(), var() fallbacks, etc.
						}
					}
				})
			}
			//#endregion VALUES
		} else if (node.type === URL) {
			if (!runStylesheet) return

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
					if (useLocations && item.locations) {
						item.locations.push(loc)
					}
				} else {
					let item = {
						count: 1,
						size,
						locations: useLocations ? [loc] : undefined,
					}
					embedTypes.unique.set(type, item)
				}
			}
		} else if (node.type === MEDIA_FEATURE) {
			if (runAtrules && node.name) {
				mediaFeatures.p(node.name.toLowerCase(), toLoc(node))
			}
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

	// Build the embed types unique object without location data in the main result
	let embedTypesUnique: Record<string, { size: number; count: number }> = {}
	for (let [type, item] of embedTypes.unique) {
		embedTypesUnique[type] = { size: item.size, count: item.count }
	}

	// Helper: conditionally include items[] based on samples option
	function withSamples<T extends object>(base: T, items: number[]): T & { items?: number[] } {
		if (samples) return assign({}, base, { items })
		return base
	}

	let result = {
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
					unique: embedTypesUnique,
				},
			},
		},
		atrules: assign(atruleCount, {
			fontface: {
				total: fontFacesCount,
				totalUnique: fontFacesCount,
				unique: fontfaces,
				uniquenessRatio: fontFacesCount === 0 ? 0 : 1,
			},
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
			scope: scopes.c(),
			complexity: atRuleComplexity,
			nesting: assign(
				atruleNesting.aggregate(),
				withSamples({}, atruleNesting.toArray()),
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
				withSamples({}, ruleSizes.toArray()),
				uniqueRuleSize.c(),
			),
			nesting: assign(
				ruleNesting.aggregate(),
				withSamples({}, ruleNesting.toArray()),
				uniqueRuleNesting.c(),
			),
			selectors: assign(
				selectorsPerRule.aggregate(),
				withSamples({}, selectorsPerRule.toArray()),
				uniqueSelectorsPerRule.c(),
			),
			declarations: assign(
				declarationsPerRule.aggregate(),
				withSamples({}, declarationsPerRule.toArray()),
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
					...(samples ? { items: specificities } : {}),
				},
				uniqueSpecificities.c(),
			),
			complexity: assign(selectorComplexity, uniqueSelectorComplexities.c(), withSamples({}, selectorComplexities.toArray())),
			nesting: assign(
				selectorNesting.aggregate(),
				withSamples({}, selectorNesting.toArray()),
				uniqueSelectorNesting.c(),
			),
			id: assign(ids.c(), {
				ratio: ratio(ids.size(), totalSelectors),
			}),
			pseudoClasses: pseudoClasses.c(),
			pseudoElements: pseudoElements.c(),
			accessibility: assign(a11y.c(), {
				ratio: ratio(a11y.size(), totalSelectors),
			}),
			attributes: attributeSelectors.c(),
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
				withSamples({}, declarationNesting.toArray()),
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
			displays: displays.c(),
		},
		__meta__: {
			parseTime: startAnalysis - startParse,
			analyzeTime: Date.now() - startAnalysis,
			total: Date.now() - start,
		},
	}

	if (!useLocations) {
		return result
	}

	// Build the parallel locations map
	let locations: Record<string, UniqueWithLocations> = {}

	function addLocs(key: string, collection: Collection | ContextCollection) {
		let locs = collection.locs()
		if (locs) locations[key] = locs
	}

	addLocs('atrules', atrules)
	addLocs('atrules.fontface', fontfaces_with_loc)
	addLocs('atrules.import', imports)
	addLocs('atrules.media', medias)
	addLocs('atrules.media.browserhacks', mediaBrowserhacks)
	addLocs('atrules.media.features', mediaFeatures)
	addLocs('atrules.charset', charsets)
	addLocs('atrules.supports', supports)
	addLocs('atrules.supports.browserhacks', supportsBrowserhacks)
	addLocs('atrules.keyframes', keyframes)
	addLocs('atrules.keyframes.prefixed', prefixedKeyframes)
	addLocs('atrules.container', containers)
	addLocs('atrules.container.names', containerNames)
	addLocs('atrules.layer', layers)
	addLocs('atrules.property', registeredProperties)
	addLocs('atrules.scope', scopes)
	addLocs('atrules.nesting', uniqueAtruleNesting)
	addLocs('rules.sizes', uniqueRuleSize)
	addLocs('rules.nesting', uniqueRuleNesting)
	addLocs('rules.selectors', uniqueSelectorsPerRule)
	addLocs('rules.declarations', uniqueDeclarationsPerRule)
	addLocs('selectors.specificity', uniqueSpecificities)
	addLocs('selectors.complexity', uniqueSelectorComplexities)
	addLocs('selectors.nesting', uniqueSelectorNesting)
	addLocs('selectors.id', ids)
	addLocs('selectors.pseudoClasses', pseudoClasses)
	addLocs('selectors.pseudoElements', pseudoElements)
	addLocs('selectors.accessibility', a11y)
	addLocs('selectors.attributes', attributeSelectors)
	addLocs('selectors.keyframes', keyframeSelectors)
	addLocs('selectors.prefixed', prefixedSelectors)
	addLocs('selectors.combinators', combinators)
	addLocs('declarations.nesting', uniqueDeclarationNesting)
	addLocs('declarations.importants.custom', importantCustomProperties)
	addLocs('properties', properties)
	addLocs('properties.prefixed', propertyVendorPrefixes)
	addLocs('properties.custom', customProperties)
	addLocs('properties.browserhacks', propertyHacks)
	addLocs('values.colors', colors)
	addLocs('values.gradients', gradients)
	addLocs('values.fontFamilies', fontFamilies)
	addLocs('values.fontSizes', fontSizes)
	addLocs('values.lineHeights', lineHeights)
	addLocs('values.zindexes', zindex)
	addLocs('values.textShadows', textShadows)
	addLocs('values.boxShadows', boxShadows)
	addLocs('values.borderRadiuses', borderRadiuses)
	addLocs('values.animations.durations', durations)
	addLocs('values.animations.timingFunctions', timingFunctions)
	addLocs('values.prefixes', vendorPrefixedValues)
	addLocs('values.browserhacks', valueBrowserhacks)
	addLocs('values.units', units)
	addLocs('values.keywords', valueKeywords)
	addLocs('values.resets', resets)
	addLocs('values.displays', displays)

	// Add embed location data if tracked
	if (useLocations) {
		let embedLocs: UniqueWithLocations = {}
		for (let [type, item] of embedTypes.unique) {
			if (item.locations) {
				embedLocs[type] = item.locations
			}
		}
		if (Object.keys(embedLocs).length > 0) {
			locations['stylesheet.embeddedContent'] = embedLocs
		}
	}

	return assign(result, { locations })
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

export { transfer } from './transfer.js'
