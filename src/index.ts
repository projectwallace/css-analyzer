// Wallace parser for dual-parser migration
import {
	type CSSNode,
	is_custom,
	SKIP,
	str_equals,
	str_starts_with,
	walk,
	parse,
	is_atrule_prelude,
	is_selector_list,
	is_rule,
	is_raw,
	is_atrule,
	is_selector,
	is_declaration,
	is_supports_declaration,
	is_identifier,
	is_attribute_selector,
	is_type_selector,
	is_pseudo_class_selector,
	is_pseudo_element_selector,
	is_url,
	is_media_feature,
	is_container_query,
	is_dimension,
	is_hash,
	is_function,
	is_operator,
	is_string,
	str_index_of,
	property_basename,
} from '@projectwallace/css-parser'
import { isSupportsBrowserhack, isMediaBrowserhack } from './atrules/atrules.ts'
import { getCombinators, getComplexity, isPrefixed, isAccessibility } from './selectors/utils.ts'
import { calculateForAST as calculateSpecificity } from './selectors/specificity.ts'
import { colorFunctions, colorKeywords, namedColors, systemColors } from './values/colors.ts'
import { destructure, SYSTEM_FONTS } from './values/destructure-font-shorthand.ts'
import { keywords, isValueReset } from './values/values.ts'
import { analyzeAnimation } from './values/animations.ts'
import { isValuePrefixed } from './values/vendor-prefix.ts'
import { isValueBrowserhack } from './values/browserhacks.ts'
import { ContextCollection } from './context-collection.ts'
import {
	Collection,
	type CollectionCount,
	type Location,
	type UniqueWithLocations,
} from './collection.ts'
import { AggregateCollection } from './aggregate-collection.ts'
import { DefinedUsed, type DefinedUsedResult } from './defined-used.ts'
import { endsWith, unquote } from './string-utils.ts'
import { getEmbedType } from './stylesheet/stylesheet.ts'
import {
	SPACING_RESET_PROPERTIES,
	border_radius_properties,
	shorthand_properties,
} from './properties/property-utils.ts'

export type Specificity = [number, number, number]

function ratio(part: number, total: number): number {
	if (total === 0) {
		return 0
	}
	return part / total
}

export type Options = {
	/** @description Use Locations (`{ 'item': [{ line, column, offset, length }] }`) instead of a regular count per occurrence (`{ 'item': 3 }`) */
	useLocations?: boolean
}

export function analyze(
	css: string,
	options?: Options & { useLocations?: false | undefined },
): ReturnType<typeof analyzeInternal<false>>
export function analyze(
	css: string,
	options: Options & { useLocations: true },
): ReturnType<typeof analyzeInternal<true>>
export function analyze(css: string, options: Options = {}): any {
	const useLocations = options.useLocations === true
	if (useLocations) {
		return analyzeInternal(css, options, true)
	}
	return analyzeInternal(css, options, false)
}

function analyzeInternal<T extends boolean>(
	css: string,
	options: Options,
	useLocations: T,
): {
	stylesheet: {
		sourceLinesOfCode: number
		linesOfCode: number
		size: number
		complexity: number
		comments: {
			total: number
			size: number
		}
		embeddedContent: {
			size: {
				total: number
				ratio: number
			}
			types: {
				total: number
				totalUnique: number
				uniquenessRatio: number
				unique: {
					[k: string]: {
						size: number
						count: number
						uniqueWithLocations?: Location[]
					}
				}
			}
		}
	}
	atrules: {
		total: number
		totalUnique: number
		unique: Record<string, number>
		uniquenessRatio: number
	} & (T extends true
		? {
				uniqueWithLocations: UniqueWithLocations
			}
		: {
				uniqueWithLocations?: undefined
			}) & {
			fontface: {
				total: number
				totalUnique: number
				unique: Record<string, string>[]
				uniquenessRatio: number
			} & (
				| {
						uniqueWithLocations: UniqueWithLocations | undefined
				  }
				| {
						uniqueWithLocations?: undefined
				  }
			)
			import: CollectionCount<T>
			media: {
				total: number
				totalUnique: number
				unique: Record<string, number>
				uniquenessRatio: number
			} & (T extends true
				? {
						uniqueWithLocations: UniqueWithLocations
					}
				: {
						uniqueWithLocations?: undefined
					}) & {
					browserhacks: CollectionCount<T>
					features: CollectionCount<T>
				}
			charset: CollectionCount<T>
			supports: {
				total: number
				totalUnique: number
				unique: Record<string, number>
				uniquenessRatio: number
			} & (T extends true
				? {
						uniqueWithLocations: UniqueWithLocations
					}
				: {
						uniqueWithLocations?: undefined
					}) & {
					browserhacks: CollectionCount<T>
				}
			keyframes: {
				total: number
				totalUnique: number
				unique: Record<string, number>
				uniquenessRatio: number
			} & (T extends true
				? {
						uniqueWithLocations: UniqueWithLocations
					}
				: {
						uniqueWithLocations?: undefined
					}) &
				DefinedUsedResult & {
					prefixed: {
						total: number
						totalUnique: number
						unique: Record<string, number>
						uniquenessRatio: number
					} & (T extends true
						? {
								uniqueWithLocations: UniqueWithLocations
							}
						: {
								uniqueWithLocations?: undefined
							}) & {
							ratio: number
						}
				}
			container: {
				total: number
				totalUnique: number
				unique: Record<string, number>
				uniquenessRatio: number
			} & (T extends true
				? {
						uniqueWithLocations: UniqueWithLocations
					}
				: {
						uniqueWithLocations?: undefined
					}) & {
					names: {
						total: number
						totalUnique: number
						unique: Record<string, number>
						uniquenessRatio: number
					} & (T extends true
						? {
								uniqueWithLocations: UniqueWithLocations
							}
						: {
								uniqueWithLocations?: undefined
							}) &
						DefinedUsedResult
				}
			layer: {
				total: number
				totalUnique: number
				unique: Record<string, number>
				uniquenessRatio: number
			} & (T extends true
				? {
						uniqueWithLocations: UniqueWithLocations
					}
				: {
						uniqueWithLocations?: undefined
					}) &
				DefinedUsedResult
			property: CollectionCount<T>
			function: CollectionCount<T>
			scope: CollectionCount<T>
			complexity: {
				min: number
				max: number
				mean: number
				mode: number
				range: number
				sum: number
			}
			nesting: {
				min: number
				max: number
				mean: number
				mode: number
				range: number
				sum: number
			} & {
				items: number[]
			} & {
				total: number
				totalUnique: number
				unique: Record<string, number>
				uniquenessRatio: number
			} & (T extends true
					? {
							uniqueWithLocations: UniqueWithLocations
						}
					: {
							uniqueWithLocations?: undefined
						})
		}
	rules: {
		total: number
		empty: {
			total: number
			ratio: number
		}
		sizes: {
			min: number
			max: number
			mean: number
			mode: number
			range: number
			sum: number
		} & {
			items: number[]
		} & {
			total: number
			totalUnique: number
			unique: Record<string, number>
			uniquenessRatio: number
		} & (T extends true
				? {
						uniqueWithLocations: UniqueWithLocations
					}
				: {
						uniqueWithLocations?: undefined
					})
		nesting: {
			min: number
			max: number
			mean: number
			mode: number
			range: number
			sum: number
		} & {
			items: number[]
		} & {
			total: number
			totalUnique: number
			unique: Record<string, number>
			uniquenessRatio: number
		} & (T extends true
				? {
						uniqueWithLocations: UniqueWithLocations
					}
				: {
						uniqueWithLocations?: undefined
					})
		selectors: {
			min: number
			max: number
			mean: number
			mode: number
			range: number
			sum: number
		} & {
			items: number[]
		} & {
			total: number
			totalUnique: number
			unique: Record<string, number>
			uniquenessRatio: number
		} & (T extends true
				? {
						uniqueWithLocations: UniqueWithLocations
					}
				: {
						uniqueWithLocations?: undefined
					})
		declarations: {
			min: number
			max: number
			mean: number
			mode: number
			range: number
			sum: number
		} & {
			items: number[]
		} & {
			total: number
			totalUnique: number
			unique: Record<string, number>
			uniquenessRatio: number
		} & (T extends true
				? {
						uniqueWithLocations: UniqueWithLocations
					}
				: {
						uniqueWithLocations?: undefined
					})
	}
	selectors: {
		total: number
		totalUnique: number
		uniquenessRatio: number
		specificity: {
			/** @type Specificity */
			min: number[]
			/** @type Specificity */
			max: number[]
			/** @type Specificity */
			sum: number[]
			/** @type Specificity */
			mean: number[]
			/** @type Specificity */
			mode: number[]
			/** @type Specificity */
			items: Specificity[]
		} & {
			total: number
			totalUnique: number
			unique: Record<string, number>
			uniquenessRatio: number
		} & (T extends true
				? {
						uniqueWithLocations: UniqueWithLocations
					}
				: {
						uniqueWithLocations?: undefined
					})
		complexity: {
			min: number
			max: number
			mean: number
			mode: number
			range: number
			sum: number
		} & {
			total: number
			totalUnique: number
			unique: Record<string, number>
			uniquenessRatio: number
		} & (T extends true
				? {
						uniqueWithLocations: UniqueWithLocations
					}
				: {
						uniqueWithLocations?: undefined
					}) & {
				items: number[]
			}
		nesting: {
			min: number
			max: number
			mean: number
			mode: number
			range: number
			sum: number
		} & {
			items: number[]
		} & {
			total: number
			totalUnique: number
			unique: Record<string, number>
			uniquenessRatio: number
		} & (T extends true
				? {
						uniqueWithLocations: UniqueWithLocations
					}
				: {
						uniqueWithLocations?: undefined
					})
		id: {
			total: number
			totalUnique: number
			unique: Record<string, number>
			uniquenessRatio: number
		} & (T extends true
			? {
					uniqueWithLocations: UniqueWithLocations
				}
			: {
					uniqueWithLocations?: undefined
				}) & {
				ratio: number
			}
		pseudoClasses: CollectionCount<T>
		pseudoElements: CollectionCount<T>
		accessibility: {
			total: number
			totalUnique: number
			unique: Record<string, number>
			uniquenessRatio: number
		} & (T extends true
			? {
					uniqueWithLocations: UniqueWithLocations
				}
			: {
					uniqueWithLocations?: undefined
				}) & {
				ratio: number
			}
		attributes: CollectionCount<T>
		customElements: CollectionCount<T>
		keyframes: CollectionCount<T>
		prefixed: {
			total: number
			totalUnique: number
			unique: Record<string, number>
			uniquenessRatio: number
		} & (T extends true
			? {
					uniqueWithLocations: UniqueWithLocations
				}
			: {
					uniqueWithLocations?: undefined
				}) & {
				ratio: number
			}
		combinators: CollectionCount<T>
	}
	declarations: {
		total: number
		totalUnique: number
		uniquenessRatio: number
		importants: {
			total: number
			ratio: number
			inKeyframes: {
				total: number
				ratio: number
			}
		}
		complexity: {
			min: number
			max: number
			mean: number
			mode: number
			range: number
			sum: number
		}
		nesting: {
			min: number
			max: number
			mean: number
			mode: number
			range: number
			sum: number
		} & {
			items: number[]
		} & {
			total: number
			totalUnique: number
			unique: Record<string, number>
			uniquenessRatio: number
		} & (T extends true
				? {
						uniqueWithLocations: UniqueWithLocations
					}
				: {
						uniqueWithLocations?: undefined
					})
	}
	properties: {
		total: number
		totalUnique: number
		unique: Record<string, number>
		uniquenessRatio: number
	} & (T extends true
		? {
				uniqueWithLocations: UniqueWithLocations
			}
		: {
				uniqueWithLocations?: undefined
			}) & {
			prefixed: {
				total: number
				totalUnique: number
				unique: Record<string, number>
				uniquenessRatio: number
			} & (T extends true
				? {
						uniqueWithLocations: UniqueWithLocations
					}
				: {
						uniqueWithLocations?: undefined
					}) & {
					ratio: number
				}
			custom: {
				total: number
				totalUnique: number
				unique: Record<string, number>
				uniquenessRatio: number
			} & (T extends true
				? {
						uniqueWithLocations: UniqueWithLocations
					}
				: {
						uniqueWithLocations?: undefined
					}) &
				DefinedUsedResult & {
					ratio: number
					importants: {
						total: number
						totalUnique: number
						unique: Record<string, number>
						uniquenessRatio: number
					} & (T extends true
						? {
								uniqueWithLocations: UniqueWithLocations
							}
						: {
								uniqueWithLocations?: undefined
							}) & {
							ratio: number
						}
				}
			shorthands: {
				total: number
				totalUnique: number
				unique: Record<string, number>
				uniquenessRatio: number
			} & (T extends true
				? {
						uniqueWithLocations: UniqueWithLocations
					}
				: {
						uniqueWithLocations?: undefined
					}) & {
					ratio: number
				}
			browserhacks: {
				total: number
				totalUnique: number
				unique: Record<string, number>
				uniquenessRatio: number
			} & (T extends true
				? {
						uniqueWithLocations: UniqueWithLocations
					}
				: {
						uniqueWithLocations?: undefined
					}) & {
					ratio: number
				}
			complexity: {
				min: number
				max: number
				mean: number
				mode: number
				range: number
				sum: number
			}
			anchorNames: DefinedUsedResult
		}
	values: {
		colors: {
			total: number
			totalUnique: number
			unique: Record<string, number>
			uniquenessRatio: number
		} & (T extends true
			? {
					uniqueWithLocations: UniqueWithLocations
				}
			: {
					uniqueWithLocations?: undefined
				}) & {
				itemsPerContext: {
					[k: string]: CollectionCount<T>
				}
			} & {
				formats: CollectionCount<T>
			}
		gradients: CollectionCount<T>
		fontFamilies: CollectionCount<T>
		fontSizes: CollectionCount<T>
		lineHeights: CollectionCount<T>
		zindexes: CollectionCount<T>
		textShadows: CollectionCount<T>
		boxShadows: CollectionCount<T>
		borderRadiuses: {
			total: number
			totalUnique: number
			unique: Record<string, number>
			uniquenessRatio: number
		} & (T extends true
			? {
					uniqueWithLocations: UniqueWithLocations
				}
			: {
					uniqueWithLocations?: undefined
				}) & {
				itemsPerContext: {
					[k: string]: CollectionCount<T>
				}
			}
		animations: {
			durations: CollectionCount<T>
			timingFunctions: CollectionCount<T>
			names: CollectionCount<T>
		}
		prefixes: CollectionCount<T>
		browserhacks: CollectionCount<T>
		units: {
			total: number
			totalUnique: number
			unique: Record<string, number>
			uniquenessRatio: number
		} & (T extends true
			? {
					uniqueWithLocations: UniqueWithLocations
				}
			: {
					uniqueWithLocations?: undefined
				}) & {
				itemsPerContext: {
					[k: string]: CollectionCount<T>
				}
			}
		complexity: {
			min: number
			max: number
			mean: number
			mode: number
			range: number
			sum: number
		}
		keywords: CollectionCount<T>
		resets: CollectionCount<T>
		displays: CollectionCount<T>
	}
	__meta__: {
		parseTime: number
		analyzeTime: number
		total: number
	}
} {
	const start = Date.now()

	// Stylesheet
	const linesOfCode = (css.match(/\n/g) || []).length + 1
	let totalComments = 0
	let commentsSize = 0
	let embedSize = 0
	const embedTypes = {
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

	const startParse = Date.now()
	const ast = parse(css, {
		on_comment({ length }) {
			totalComments++
			// includes /* and */ in the size calculation
			commentsSize += length
		},
	})

	const startAnalysis = Date.now()

	// Atrules
	const atrules = new Collection(useLocations)
	const atRuleComplexities = new AggregateCollection()
	/** @type {Record<string, string>[]} */
	const fontfaces: Record<string, string>[] = []
	const fontfaces_with_loc = new Collection(useLocations)
	const layers = new Collection(useLocations)
	const imports = new Collection(useLocations)
	const medias = new Collection(useLocations)
	const mediaBrowserhacks = new Collection(useLocations)
	const mediaFeatures = new Collection(useLocations)
	const charsets = new Collection(useLocations)
	const supports = new Collection(useLocations)
	const supportsBrowserhacks = new Collection(useLocations)
	const keyframes = new Collection(useLocations)
	const prefixedKeyframes = new Collection(useLocations)
	const containers = new Collection(useLocations)
	const containerNames = new Collection(useLocations)
	const registeredProperties = new Collection(useLocations)
	const functions = new Collection(useLocations)
	const scopes = new Collection(useLocations)
	const atruleNesting = new AggregateCollection()
	const uniqueAtruleNesting = new Collection(useLocations)

	// Rules
	let totalRules = 0
	let emptyRules = 0
	const ruleSizes = new AggregateCollection()
	const selectorsPerRule = new AggregateCollection()
	const declarationsPerRule = new AggregateCollection()
	const uniqueRuleSize = new Collection(useLocations)
	const uniqueSelectorsPerRule = new Collection(useLocations)
	const uniqueDeclarationsPerRule = new Collection(useLocations)
	const ruleNesting = new AggregateCollection()
	const uniqueRuleNesting = new Collection(useLocations)

	// Selectors
	const keyframeSelectors = new Collection(useLocations)
	const uniqueSelectors = new Set()
	const prefixedSelectors = new Collection(useLocations)
	let maxSpecificity: Specificity | undefined
	let minSpecificity: Specificity | undefined
	const specificityA = new AggregateCollection()
	const specificityB = new AggregateCollection()
	const specificityC = new AggregateCollection()
	const uniqueSpecificities = new Collection(useLocations)
	const selectorComplexities = new AggregateCollection()
	const uniqueSelectorComplexities = new Collection(useLocations)
	const specificities: Specificity[] = []
	const ids = new Collection(useLocations)
	const a11y = new Collection(useLocations)
	const pseudoClasses = new Collection(useLocations)
	const pseudoElements = new Collection(useLocations)
	const attributeSelectors = new Collection(useLocations)
	const customElementSelectors = new Collection(useLocations)
	const combinators = new Collection(useLocations)
	const selectorNesting = new AggregateCollection()
	const uniqueSelectorNesting = new Collection(useLocations)

	// Declarations
	const uniqueDeclarations = new Set()
	let totalDeclarations = 0
	const declarationComplexities = new AggregateCollection()
	let importantDeclarations = 0
	let importantsInKeyframes = 0
	const importantCustomProperties = new Collection(useLocations)
	const declarationNesting = new AggregateCollection()
	const uniqueDeclarationNesting = new Collection(useLocations)

	// Properties
	const properties = new Collection(useLocations)
	const propertyHacks = new Collection(useLocations)
	const propertyVendorPrefixes = new Collection(useLocations)
	const customProperties = new Collection(useLocations)
	const shorthands = new Collection(useLocations)
	const propertyComplexities = new AggregateCollection()

	// Values
	const valueComplexities = new AggregateCollection()
	const vendorPrefixedValues = new Collection(useLocations)
	const valueBrowserhacks = new Collection(useLocations)
	const displays = new Collection(useLocations)
	const zindex = new Collection(useLocations)
	const textShadows = new Collection(useLocations)
	const boxShadows = new Collection(useLocations)
	const fontFamilies = new Collection(useLocations)
	const fontSizes = new Collection(useLocations)
	const lineHeights = new Collection(useLocations)
	const timingFunctions = new Collection(useLocations)
	const durations = new Collection(useLocations)
	const animationNames = new Collection(useLocations)
	const colors = new ContextCollection(useLocations)
	const colorFormats = new Collection(useLocations)
	const units = new ContextCollection(useLocations)
	const gradients = new Collection(useLocations)
	const valueKeywords = new Collection(useLocations)
	const borderRadiuses = new ContextCollection(useLocations)
	const resets = new Collection(useLocations)

	const customPropsTracking = new DefinedUsed()
	const animationNamesTracking = new DefinedUsed()
	const containerNamesTracking = new DefinedUsed()
	const layerNamesTracking = new DefinedUsed()
	const anchorNamesTracking = new DefinedUsed()

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
		const inKeyframes = keyframesDepth >= 0 && depth > keyframesDepth

		// Count nodes and track nesting
		if (is_atrule(node)) {
			const atruleLoc = toLoc(node)
			atruleNesting.push(depth)
			uniqueAtruleNesting.p(depth, atruleLoc)
			const normalized_name = property_basename(node.name ?? '')
			atrules.p(normalized_name, atruleLoc)

			//#region @FONT-FACE
			if (normalized_name === 'font-face') {
				const descriptors = Object.create(null)
				if (useLocations) {
					fontfaces_with_loc.p(node.start, toLoc(node))
				}
				const block = node.block
				block?.for_each((descriptor) => {
					if (is_declaration(descriptor) && descriptor.value) {
						descriptors[descriptor.property] = descriptor.value.text
					}
				})
				atRuleComplexities.push(1)
				fontfaces.push(descriptors)
			}
			//#endregion

			// oxlint-disable-next-line no-negated-condition
			if (!node.has_prelude) {
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
					const prelude = unquote(node.prelude.text)
					keyframes.p(prelude, toLoc(node))
					animationNamesTracking.define(prelude)

					if (node.is_vendor_prefixed) {
						prefixedKeyframes.p(`@${node.name?.toLowerCase()} ${node.prelude.text}`, toLoc(node))
						complexity++
					}

					// Mark the depth at which we enter a keyframes atrule
					keyframesDepth = depth
				} else if (normalized_name === 'layer') {
					for (const layer of node.prelude.text.split(',').map((s: string) => s.trim())) {
						layers.p(layer, toLoc(node))
						// @layer name { } places CSS into a layer (use); @layer a, b; orders layers (define)
						if (node.block) {
							layerNamesTracking.use(layer)
						} else {
							layerNamesTracking.define(layer)
						}
					}
				} else if (normalized_name === 'import') {
					imports.p(node.prelude.text, toLoc(node))

					if (is_atrule_prelude(node.prelude) && node.prelude.has_children) {
						node.prelude.for_each((child) => {
							if (!is_function(child)) {
								return
							}

							if (str_equals('supports', child.name) && child.value) {
								supports.p(child.value, toLoc(child))
							} else if (str_equals('layer', child.name) && child.value) {
								// layer() can be empty
								layers.p(child.value, toLoc(child))
								layerNamesTracking.use(child.value)
							}
						})
					}
				} else if (normalized_name === 'container') {
					const { prelude } = node
					containers.p(prelude.text, toLoc(node))
					if (is_atrule_prelude(prelude) && is_container_query(prelude.first_child)) {
						const container_query = prelude.first_child
						const container_name = container_query.first_child
						if (container_name && is_identifier(container_name)) {
							containerNames.p(container_name.text, toLoc(node))
							containerNamesTracking.use(container_name.text)
						}
					}
				} else if (normalized_name === 'property') {
					registeredProperties.p(node.prelude.text, toLoc(node))
					customPropsTracking.define(node.prelude.text)
				} else if (normalized_name === 'function') {
					const prelude = node.prelude.text
					const name = prelude.includes('(')
						? prelude.slice(0, prelude.indexOf('(')).trim()
						: prelude.trim()
					functions.p(name, toLoc(node))
				} else if (normalized_name === 'charset') {
					charsets.p(node.prelude.text.toLowerCase(), toLoc(node))
				} else if (normalized_name === 'scope') {
					scopes.p(node.prelude.text, toLoc(node))
				}

				atRuleComplexities.push(complexity)
			}
		} else if (is_rule(node)) {
			// Handle keyframe rules specially
			if (inKeyframes && node.has_prelude) {
				if (is_selector_list(node.prelude) && node.prelude.child_count > 0) {
					node.prelude.for_each((keyframe_selector) => {
						keyframeSelectors.p(keyframe_selector.text, toLoc(keyframe_selector))
					})
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
				const loc = toLoc(node)

				// Find the SelectorList child and count Selector nodes inside it
				if (node.has_prelude && is_selector_list(node.prelude)) {
					node.prelude.for_each((selector) => {
						if (is_selector(selector)) {
							numSelectors++
						}
					})
				}

				// Count declarations in the block
				if (node.block) {
					node.block.for_each((declaration) => {
						if (is_declaration(declaration)) {
							numDeclarations++
						}
					})
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
		} else if (is_selector(node)) {
			// Keyframe selectors are now handled at the Rule level, so skip them here
			if (inKeyframes) {
				return SKIP
			}

			const loc = toLoc(node)

			selectorNesting.push(depth > 0 ? depth - 1 : 0)
			uniqueSelectorNesting.p(depth > 0 ? depth - 1 : 0, loc)
			uniqueSelectors.add(node.text)

			const complexity = getComplexity(node)
			selectorComplexities.push(complexity)
			uniqueSelectorComplexities.p(complexity, loc)

			isPrefixed(node, (prefix) => {
				prefixedSelectors.p(prefix.toLowerCase(), loc)
			})

			// Check for accessibility selectors
			isAccessibility(node, (a11y_selector) => {
				a11y.p(a11y_selector, loc)
			})

			walk(node, (child) => {
				if (is_attribute_selector(child)) {
					attributeSelectors.p(child.name.toLowerCase(), loc)
				} else if (is_type_selector(child) && !is_custom(child.name) && child.name.includes('-')) {
					customElementSelectors.p(child.name.toLowerCase(), loc)
				} else if (is_pseudo_class_selector(child)) {
					pseudoClasses.p(child.name.toLowerCase(), loc)
				} else if (is_pseudo_element_selector(child)) {
					pseudoElements.p(child.name.toLowerCase(), loc)
				}
			})

			getCombinators(node, (combinator) => {
				const name = combinator.name.trim() === '' ? ' ' : combinator.name
				combinators.p(name, combinator.loc)
			})

			const specificity = calculateSpecificity(node)
			const [sa, sb, sc] = specificity

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
		} else if (is_supports_declaration(node)) {
			// Prevent walking into a SupportsDeclaration.Declaration
			return SKIP
		} else if (is_declaration(node)) {
			totalDeclarations++
			const declaration = node.text
			uniqueDeclarations.add(declaration)

			const loc = toLoc(node)
			const declarationDepth = depth > 0 ? depth - 1 : 0
			declarationNesting.push(declarationDepth)
			uniqueDeclarationNesting.p(declarationDepth, loc)

			let complexity = 1
			if (node.is_important) {
				complexity++

				if (str_index_of('!important', declaration) === -1) {
					valueBrowserhacks.p('!ie', toLoc(node.value as CSSNode))
				}

				if (inKeyframes) {
					importantsInKeyframes++
					complexity++
				}
			}
			declarationComplexities.push(complexity)

			//#region PROPERTIES
			const { is_important, property, is_browserhack, is_vendor_prefixed } = node

			if (!property) {
				return
			}

			const propertyLoc = toLoc(node)
			propertyLoc.length = property.length
			const normalizedProperty = property_basename(property)

			properties.p(normalizedProperty, propertyLoc)

			if (is_important) {
				importantDeclarations++
			}

			// Count important declarations
			if (is_vendor_prefixed) {
				propertyComplexities.push(2)
				propertyVendorPrefixes.p(property, propertyLoc)
			} else if (is_custom(property)) {
				customProperties.p(property, propertyLoc)
				customPropsTracking.define(property)
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

			if (shorthand_properties.has(normalizedProperty)) {
				shorthands.p(property, propertyLoc)
			}
			//#endregion PROPERTIES

			//#region VALUES
			// Values are analyzed inside declaration because we need context, like which property is used
			{
				const value = node.value
				if (!value) {
					return
				}
				if (is_raw(value)) {
					return
				}

				let { text } = value
				const valueLoc = toLoc(value)
				let complexity = 1

				// auto, inherit, initial, none, etc.
				if (keywords.has(text)) {
					valueKeywords.p(text.toLowerCase(), valueLoc)
					valueComplexities.push(complexity)

					if (normalizedProperty === 'display') {
						displays.p(text.toLowerCase(), valueLoc)
					}

					return
				}

				//#region VALUE COMPLEXITY
				// i.e. `background-image: -webkit-linear-gradient()`
				isValuePrefixed(value, (prefixed) => {
					vendorPrefixedValues.p(prefixed.toLowerCase(), valueLoc)
					complexity++
				})

				// value browserhacks: progid:, \9, \7, alpha(), expression(), .htc
				if (!is_custom(property)) {
					isValueBrowserhack(value, (hack) => {
						valueBrowserhacks.p(hack, valueLoc)
						complexity++
						if (hack === '\\9' || hack === '\\7') {
							text = text.slice(0, -2)
						}
					})
				}
				//#endregion VALUE COMPLEXITY

				// Open question: should shorthands be counted towards complexity?
				valueComplexities.push(complexity)

				// Process properties first that don't have colors,
				// so we can avoid further walking them;
				if (SPACING_RESET_PROPERTIES.has(normalizedProperty)) {
					if (isValueReset(value)) {
						resets.p(normalizedProperty, valueLoc)
					}
				} else if (normalizedProperty === 'display') {
					if (/var\(/i.test(text)) {
						displays.p(text, valueLoc)
					} else {
						displays.p(text.toLowerCase(), valueLoc)
					}
				} else if (normalizedProperty === 'z-index') {
					zindex.p(text, valueLoc)
					return SKIP
				} else if (normalizedProperty === 'font') {
					if (!SYSTEM_FONTS.has(text)) {
						const result = destructure(value, function (keyword) {
							valueKeywords.p(keyword.toLowerCase(), valueLoc)
						})

						if (!result) {
							return SKIP
						}

						const { font_size, line_height, font_family } = result
						if (font_family) {
							fontFamilies.p(font_family, valueLoc)
						}

						if (font_size) {
							fontSizes.p(font_size.toLowerCase(), valueLoc)
						}

						if (line_height) {
							lineHeights.p(line_height.toLowerCase(), valueLoc)
						}
					}
					// Don't return SKIP here - let walker continue to find
					// units, colors, and font families in var() fallbacks
				} else if (normalizedProperty === 'font-size') {
					if (!SYSTEM_FONTS.has(text)) {
						if (str_index_of('var(', text) === -1) {
							fontSizes.p(text.toLowerCase(), valueLoc)
						} else {
							fontSizes.p(text, valueLoc)
						}
					}
				} else if (normalizedProperty === 'font-family') {
					if (!SYSTEM_FONTS.has(text)) {
						fontFamilies.p(text, valueLoc)
					}
					return SKIP // to prevent finding color false positives (Black as font family name is not a color)
				} else if (normalizedProperty === 'line-height') {
					if (str_index_of('var(', text) === -1) {
						lineHeights.p(text.toLowerCase(), valueLoc)
					} else {
						lineHeights.p(text, valueLoc)
					}
				} else if (normalizedProperty === 'transition' || normalizedProperty === 'animation') {
					const isAnimation = normalizedProperty === 'animation'
					analyzeAnimation(value, function (item) {
						if (item.type === 'fn') {
							timingFunctions.p(item.value.text.toLowerCase(), valueLoc)
						} else if (item.type === 'duration') {
							durations.p(item.value.text.toLowerCase(), valueLoc)
							if (is_dimension(item.value)) {
								units.push(item.value.unit.toLowerCase(), property, toLoc(item.value))
							}
						} else if (item.type === 'delay') {
							if (is_dimension(item.value)) {
								units.push(item.value.unit.toLowerCase(), property, toLoc(item.value))
							}
						} else if (item.type === 'keyword') {
							valueKeywords.p(item.value.text.toLowerCase(), valueLoc)
						} else if (item.type === 'name' && isAnimation) {
							const name = unquote(item.value.text)
							animationNames.p(name, valueLoc)
							animationNamesTracking.use(name)
						}
					})
					return SKIP
				} else if (
					normalizedProperty === 'animation-duration' ||
					normalizedProperty === 'transition-duration'
				) {
					value.for_each((child) => {
						if (!is_operator(child)) {
							const text = child.text
							if (/var\(/i.test(text)) {
								durations.p(text, valueLoc)
							} else {
								durations.p(text.toLowerCase(), valueLoc)
							}
						}
					})
				} else if (
					normalizedProperty === 'transition-timing-function' ||
					normalizedProperty === 'animation-timing-function'
				) {
					value.for_each((child) => {
						if (!is_operator(child)) {
							timingFunctions.p(child.text, valueLoc)
						}
					})
				} else if (normalizedProperty === 'animation-name') {
					value.for_each((child) => {
						if (is_identifier(child) && !keywords.has(child.name)) {
							animationNames.p(child.text, valueLoc)
							animationNamesTracking.use(child.text)
						} else if (is_string(child)) {
							const name = unquote(child.text)
							animationNames.p(name, valueLoc)
							animationNamesTracking.use(name)
						}
					})
				} else if (normalizedProperty === 'container-name') {
					value.for_each((child) => {
						if (is_identifier(child) && !keywords.has(child.name)) {
							containerNames.p(child.text, toLoc(child))
							containerNamesTracking.define(child.text)
						}
					})
				} else if (normalizedProperty === 'container') {
					// The first identifier in the `container` shorthand is the container name
					// Example: container: my-layout / inline-size;
					if (value.first_child && is_identifier(value.first_child)) {
						containerNames.p(value.first_child.text, valueLoc)
						if (!keywords.has(value.first_child.name)) {
							containerNamesTracking.define(value.first_child.text)
						}
					}
				} else if (normalizedProperty === 'anchor-name') {
					value.for_each((child) => {
						if (is_identifier(child) && is_custom(child.text)) {
							anchorNamesTracking.define(child.text)
						}
					})
				} else if (normalizedProperty === 'position-anchor') {
					if (
						value.first_child &&
						is_identifier(value.first_child) &&
						is_custom(value.first_child.text)
					) {
						anchorNamesTracking.use(value.first_child.text)
					}
				} else if (border_radius_properties.has(normalizedProperty)) {
					borderRadiuses.push(text, property, valueLoc)
				} else if (normalizedProperty === 'text-shadow') {
					textShadows.p(text, valueLoc)
				} else if (normalizedProperty === 'box-shadow') {
					boxShadows.p(text, valueLoc)
				}

				walk(value, (valueNode) => {
					if (is_dimension(valueNode)) {
						const unit = valueNode.unit.toLowerCase()
						const loc = toLoc(valueNode)
						units.push(unit, property, loc)
						return SKIP
					}

					if (is_hash(valueNode)) {
						// Use text property for the hash value
						const hashText = valueNode.text
						if (!hashText || !hashText.startsWith('#')) {
							return SKIP
						}
						let hashValue = hashText.toLowerCase()

						// Strip any IE9 browserhack (\9 or \7) so only the color remains
						if (endsWith('\\9', hashValue) || endsWith('\\7', hashValue)) {
							hashValue = hashValue.slice(0, -2)
						}
						const hexLength = hashValue.length - 1 // Remove the # from length

						const hashLoc = toLoc(valueNode)
						colors.push(hashValue, property, hashLoc)
						colorFormats.p(`hex` + hexLength, hashLoc)

						return SKIP
					}

					if (is_identifier(valueNode)) {
						const identifierText = valueNode.text
						const identifierLoc = toLoc(valueNode)

						// Skip all identifier processing for font properties to avoid:
						// 1. False positives for colors (e.g., "Black" as a font family vs. "black" the color)
						// 2. Duplicate keywords (already extracted by destructure)
						if (normalizedProperty === 'font' || normalizedProperty === 'font-family') {
							return SKIP
						}

						if (keywords.has(identifierText)) {
							valueKeywords.p(identifierText.toLowerCase(), identifierLoc)
						}

						// Bail out if it can't be a color name
						// 20 === 'lightgoldenrodyellow'.length
						// 3 === 'red'.length
						const nodeLen = identifierText.length
						if (nodeLen > 20 || nodeLen < 3) {
							return SKIP
						}

						// A keyword is most likely to be 'transparent' or 'currentColor'
						if (colorKeywords.has(identifierText)) {
							const colorKeyword = identifierText.toLowerCase()
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

					if (is_function(valueNode)) {
						const funcName = valueNode.name
						const funcLoc = toLoc(valueNode)
						const firstFuncChild = valueNode.first_child

						// Track var(--custom-property) usage
						if (str_equals('var', funcName) && firstFuncChild && is_identifier(firstFuncChild)) {
							const name = firstFuncChild.text
							if (is_custom(name)) {
								customPropsTracking.use(name)
							}
						}

						// Track anchor(--name) and anchor-size(--name) usage
						if (
							(str_equals('anchor', funcName) || str_equals('anchor-size', funcName)) &&
							firstFuncChild &&
							is_identifier(firstFuncChild) &&
							is_custom(firstFuncChild.text)
						) {
							anchorNamesTracking.use(firstFuncChild.text)
						}

						// rgb(a), hsl(a), color(), hwb(), lch(), lab(), oklab(), oklch()
						if (colorFunctions.has(funcName)) {
							colors.push(valueNode.text, property, funcLoc)
							colorFormats.p(funcName.toLowerCase(), funcLoc)
							return
						}

						if (endsWith('gradient', funcName)) {
							gradients.p(valueNode.text, funcLoc)
						}
						// No SKIP here intentionally,
						// otherwise we'll miss colors in linear-gradient(), var() fallbacks, etc.
					}
				})
			}
			//#endregion VALUES
		} else if (is_url(node)) {
			const { value } = node
			const embed = unquote(value ?? '')
			if (str_starts_with('data:', embed)) {
				const size = embed.length
				const type = getEmbedType(embed)

				embedTypes.total++
				embedSize += size

				const loc = {
					line: node.line,
					column: node.column,
					offset: node.start,
					length: node.length,
				}

				if (embedTypes.unique.has(type)) {
					const item = embedTypes.unique.get(type)!
					item.count++
					item.size += size
					embedTypes.unique.set(type, item)
					if (useLocations && item.uniqueWithLocations) {
						item.uniqueWithLocations.push(loc)
					}
				} else {
					const item = {
						count: 1,
						size,
						uniqueWithLocations: useLocations ? [loc] : undefined,
					}
					embedTypes.unique.set(type, item)
				}
			}
		} else if (is_media_feature(node)) {
			mediaFeatures.p(node.property?.toLowerCase(), toLoc(node))
			return SKIP
		}
	})

	const totalUniqueDeclarations = uniqueDeclarations.size

	const totalSelectors = selectorComplexities.size()
	const specificitiesA = specificityA.aggregate()
	const specificitiesB = specificityB.aggregate()
	const specificitiesC = specificityC.aggregate()
	const totalUniqueSelectors = uniqueSelectors.size
	const assign = Object.assign
	const cssLen = css.length
	const fontFacesCount = fontfaces.length
	const atRuleComplexity = atRuleComplexities.aggregate()
	const selectorComplexity = selectorComplexities.aggregate()
	const declarationComplexity = declarationComplexities.aggregate()
	const propertyComplexity = propertyComplexities.aggregate()
	const valueComplexity = valueComplexities.aggregate()
	const atruleCount = atrules.c()

	return {
		stylesheet: {
			sourceLinesOfCode:
				atruleCount.total + totalSelectors + totalDeclarations + keyframeSelectors.size(),
			linesOfCode,
			size: cssLen,
			complexity:
				atRuleComplexity.sum +
				selectorComplexity.sum +
				declarationComplexity.sum +
				propertyComplexity.sum +
				valueComplexity.sum,
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
			keyframes: assign(keyframes.c(), animationNamesTracking.analyze(), {
				prefixed: assign(prefixedKeyframes.c(), {
					ratio: ratio(prefixedKeyframes.size(), keyframes.size()),
				}),
			}),
			container: assign(containers.c(), {
				names: assign(containerNames.c(), containerNamesTracking.analyze()),
			}),
			layer: assign(layers.c(), layerNamesTracking.analyze()),
			property: registeredProperties.c(),
			function: functions.c(),
			scope: scopes.c(),
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
			pseudoElements: pseudoElements.c(),
			accessibility: assign(a11y.c(), {
				ratio: ratio(a11y.size(), totalSelectors),
			}),
			attributes: attributeSelectors.c(),
			customElements: customElementSelectors.c(),
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
			custom: assign(customProperties.c(), customPropsTracking.analyze(), {
				ratio: ratio(customProperties.size(), properties.size()),
				importants: assign(importantCustomProperties.c(), {
					ratio: ratio(importantCustomProperties.size(), customProperties.size()),
				}),
			}),
			shorthands: assign(shorthands.c(), {
				ratio: ratio(shorthands.size(), properties.size()),
			}),
			browserhacks: assign(propertyHacks.c(), {
				ratio: ratio(propertyHacks.size(), properties.size()),
			}),
			complexity: propertyComplexity,
			anchorNames: anchorNamesTracking.analyze(),
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
				names: animationNames.c(),
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
}

/**
 * Compare specificity A to Specificity B
 * @deprecated this one is the inverse of the one exported in /selectors/index.ts; wille be removed in next major version
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

export { calculate as calculateSpecificity } from './selectors/specificity.ts'

export {
	getComplexity as selectorComplexity,
	isPrefixed as isSelectorPrefixed,
	isAccessibility as isAccessibilitySelector,
} from './selectors/utils.ts'

export { isSupportsBrowserhack, isMediaBrowserhack } from './atrules/atrules.ts'

export { isHack as isPropertyHack } from './properties/property-utils.ts'

export { isValuePrefixed } from './values/vendor-prefix.ts'

export { isValueBrowserhack } from './values/browserhacks.ts'

export { colorFunctions, colorKeywords, namedColors, systemColors } from './values/colors.ts'

export { keywords as cssKeywords } from './values/values.ts'

export { hasVendorPrefix } from './vendor-prefix.ts'

export { KeywordSet } from './keyword-set.ts'

export { DefinedUsed, type DefinedUsedResult } from './defined-used.ts'

export type { Location, UniqueWithLocations } from './collection.ts'
