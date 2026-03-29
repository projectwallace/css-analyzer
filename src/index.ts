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
	TYPE_SELECTOR,
	PSEUDO_CLASS_SELECTOR,
	PSEUDO_ELEMENT_SELECTOR,
} from '@projectwallace/css-parser'
import { isSupportsBrowserhack, isMediaBrowserhack } from './atrules/atrules.js'
import { getCombinators, getComplexity, isPrefixed, isAccessibility } from './selectors/utils.js'
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
import { getEmbedType } from './stylesheet/stylesheet.js'
import { isIe9Hack } from './values/browserhacks.js'
import { basename, SPACING_RESET_PROPERTIES, border_radius_properties, shorthand_properties } from './properties/property-utils.js'

export type Specificity = [number, number, number]

function ratio(part: number, total: number): number {
	if (total === 0) return 0
	return part / total
}

/** All valid dot-notation paths matching the output structure of {@link analyze} */
export type AnalysisPath =
	| 'stylesheet'
	| 'stylesheet.embeddedContent'
	| 'atrules'
	| 'atrules.fontface'
	| 'atrules.import'
	| 'atrules.media'
	| 'atrules.media.browserhacks'
	| 'atrules.media.features'
	| 'atrules.charset'
	| 'atrules.supports'
	| 'atrules.supports.browserhacks'
	| 'atrules.keyframes'
	| 'atrules.keyframes.prefixed'
	| 'atrules.container'
	| 'atrules.container.names'
	| 'atrules.layer'
	| 'atrules.property'
	| 'atrules.function'
	| 'atrules.scope'
	| 'atrules.complexity'
	| 'atrules.nesting'
	| 'atrules.nesting.items'
	| 'rules'
	| 'rules.empty'
	| 'rules.sizes'
	| 'rules.sizes.items'
	| 'rules.nesting'
	| 'rules.nesting.items'
	| 'rules.selectors'
	| 'rules.selectors.items'
	| 'rules.declarations'
	| 'rules.declarations.items'
	| 'selectors'
	| 'selectors.specificity'
	| 'selectors.specificity.items'
	| 'selectors.complexity'
	| 'selectors.complexity.items'
	| 'selectors.nesting'
	| 'selectors.nesting.items'
	| 'selectors.id'
	| 'selectors.pseudoClasses'
	| 'selectors.pseudoElements'
	| 'selectors.accessibility'
	| 'selectors.attributes'
	| 'selectors.customElements'
	| 'selectors.keyframes'
	| 'selectors.prefixed'
	| 'selectors.combinators'
	| 'declarations'
	| 'declarations.importants'
	| 'declarations.complexity'
	| 'declarations.nesting'
	| 'declarations.nesting.items'
	| 'properties'
	| 'properties.prefixed'
	| 'properties.custom'
	| 'properties.shorthands'
	| 'properties.browserhacks'
	| 'properties.complexity'
	| 'values'
	| 'values.colors'
	| 'values.gradients'
	| 'values.fontFamilies'
	| 'values.fontSizes'
	| 'values.lineHeights'
	| 'values.zindexes'
	| 'values.textShadows'
	| 'values.boxShadows'
	| 'values.borderRadiuses'
	| 'values.animations'
	| 'values.prefixes'
	| 'values.browserhacks'
	| 'values.units'
	| 'values.complexity'
	| 'values.keywords'
	| 'values.resets'
	| 'values.displays'

const ALL_PATHS: Set<AnalysisPath> = new Set([
	'stylesheet',
	'stylesheet.embeddedContent',
	'atrules',
	'atrules.fontface',
	'atrules.import',
	'atrules.media',
	'atrules.media.browserhacks',
	'atrules.media.features',
	'atrules.charset',
	'atrules.supports',
	'atrules.supports.browserhacks',
	'atrules.keyframes',
	'atrules.keyframes.prefixed',
	'atrules.container',
	'atrules.container.names',
	'atrules.layer',
	'atrules.property',
	'atrules.function',
	'atrules.scope',
	'atrules.complexity',
	'atrules.nesting',
	'atrules.nesting.items',
	'rules',
	'rules.empty',
	'rules.sizes',
	'rules.sizes.items',
	'rules.nesting',
	'rules.nesting.items',
	'rules.selectors',
	'rules.selectors.items',
	'rules.declarations',
	'rules.declarations.items',
	'selectors',
	'selectors.specificity',
	'selectors.specificity.items',
	'selectors.complexity',
	'selectors.complexity.items',
	'selectors.nesting',
	'selectors.nesting.items',
	'selectors.id',
	'selectors.pseudoClasses',
	'selectors.pseudoElements',
	'selectors.accessibility',
	'selectors.attributes',
	'selectors.customElements',
	'selectors.keyframes',
	'selectors.prefixed',
	'selectors.combinators',
	'declarations',
	'declarations.importants',
	'declarations.complexity',
	'declarations.nesting',
	'declarations.nesting.items',
	'properties',
	'properties.prefixed',
	'properties.custom',
	'properties.shorthands',
	'properties.browserhacks',
	'properties.complexity',
	'values',
	'values.colors',
	'values.gradients',
	'values.fontFamilies',
	'values.fontSizes',
	'values.lineHeights',
	'values.zindexes',
	'values.textShadows',
	'values.boxShadows',
	'values.borderRadiuses',
	'values.animations',
	'values.prefixes',
	'values.browserhacks',
	'values.units',
	'values.complexity',
	'values.keywords',
	'values.resets',
	'values.displays',
])

/**
 * Resolve the active set of analysis paths from include/exclude options.
 * Returns null when all features are active (no filtering needed).
 */
function resolve_features(include: AnalysisPath[] | undefined, exclude: AnalysisPath[] | undefined): Set<AnalysisPath> | null {
	if ((!include || include.length === 0) && (!exclude || exclude.length === 0)) {
		return null
	}

	let active: Set<AnalysisPath>

	if (include && include.length > 0) {
		active = new Set<AnalysisPath>()
		for (let path of include) {
			// Add the path itself and all its children
			for (let p of ALL_PATHS) {
				if (p === path || p.startsWith(path + '.')) {
					active.add(p)
				}
			}
		}
	} else {
		active = new Set(ALL_PATHS)
	}

	if (exclude && exclude.length > 0) {
		for (let path of exclude) {
			for (let p of [...active]) {
				if (p === path || p.startsWith(path + '.')) {
					active.delete(p)
				}
			}
		}
	}

	return active
}

/**
 * Check whether a given path should be analyzed.
 * Since resolve_features already fully expands all child paths, we only need:
 * - Exact match (the path itself is in the active set)
 * - Child-requires-parent: a child path in the set requires its parent to run
 *   (e.g. if 'atrules.media' is in the set, 'atrules' must run to reach it)
 */
function feature_active(features: Set<AnalysisPath> | null, path: AnalysisPath): boolean {
	if (features === null) return true
	if (features.has(path)) return true
	// Child-requires-parent: check if any entry in the set is a child of this path
	let prefix = path + '.'
	for (let f of features) {
		if (f.startsWith(prefix)) return true
	}
	return false
}

export type Options = {
	/** @description Use Locations (`{ 'item': [{ line, column, offset, length }] }`) instead of a regular count per occurrence (`{ 'item': 3 }`) */
	useLocations?: boolean
	/**
	 * @description Only analyze the specified paths. Paths match the keys of the output object (e.g. `['atrules', 'selectors.complexity']`).
	 * When both `include` and `exclude` are provided, `include` is resolved first and `exclude` is subtracted from the result.
	 */
	include?: AnalysisPath[]
	/**
	 * @description Exclude the specified paths from analysis. Paths match the keys of the output object (e.g. `['values', 'atrules.media.browserhacks']`).
	 * Excluding a path also excludes all its children.
	 */
	exclude?: AnalysisPath[]
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

	// Resolve which features to analyze based on include/exclude options
	let features = resolve_features(options.include, options.exclude)

	// Precomputed feature flags (avoid per-node overhead during walk)
	let f_stylesheet_embedded = feature_active(features, 'stylesheet.embeddedContent')
	let f_atrules = feature_active(features, 'atrules')
	let f_atrules_fontface = feature_active(features, 'atrules.fontface')
	let f_atrules_import = feature_active(features, 'atrules.import')
	let f_atrules_media = feature_active(features, 'atrules.media')
	let f_atrules_media_browserhacks = feature_active(features, 'atrules.media.browserhacks')
	let f_atrules_media_features = feature_active(features, 'atrules.media.features')
	let f_atrules_charset = feature_active(features, 'atrules.charset')
	let f_atrules_supports = feature_active(features, 'atrules.supports')
	let f_atrules_supports_browserhacks = feature_active(features, 'atrules.supports.browserhacks')
	let f_atrules_keyframes = feature_active(features, 'atrules.keyframes')
	let f_atrules_keyframes_prefixed = feature_active(features, 'atrules.keyframes.prefixed')
	let f_atrules_container = feature_active(features, 'atrules.container')
	let f_atrules_container_names = feature_active(features, 'atrules.container.names')
	let f_atrules_layer = feature_active(features, 'atrules.layer')
	let f_atrules_property = feature_active(features, 'atrules.property')
	let f_atrules_function = feature_active(features, 'atrules.function')
	let f_atrules_scope = feature_active(features, 'atrules.scope')
	let f_atrules_complexity = feature_active(features, 'atrules.complexity')
	let f_atrules_nesting = feature_active(features, 'atrules.nesting')
	let f_atrules_nesting_items = feature_active(features, 'atrules.nesting.items')
	let f_rules = feature_active(features, 'rules')
	let f_rules_empty = feature_active(features, 'rules.empty')
	let f_rules_sizes = feature_active(features, 'rules.sizes')
	let f_rules_sizes_items = feature_active(features, 'rules.sizes.items')
	let f_rules_nesting = feature_active(features, 'rules.nesting')
	let f_rules_nesting_items = feature_active(features, 'rules.nesting.items')
	let f_rules_selectors = feature_active(features, 'rules.selectors')
	let f_rules_selectors_items = feature_active(features, 'rules.selectors.items')
	let f_rules_declarations = feature_active(features, 'rules.declarations')
	let f_rules_declarations_items = feature_active(features, 'rules.declarations.items')
	let f_selectors = feature_active(features, 'selectors')
	let f_selectors_specificity = feature_active(features, 'selectors.specificity')
	let f_selectors_specificity_items = feature_active(features, 'selectors.specificity.items')
	let f_selectors_complexity = feature_active(features, 'selectors.complexity')
	let f_selectors_complexity_items = feature_active(features, 'selectors.complexity.items')
	let f_selectors_nesting = feature_active(features, 'selectors.nesting')
	let f_selectors_nesting_items = feature_active(features, 'selectors.nesting.items')
	let f_selectors_id = feature_active(features, 'selectors.id')
	let f_selectors_pseudoclasses = feature_active(features, 'selectors.pseudoClasses')
	let f_selectors_pseudoelements = feature_active(features, 'selectors.pseudoElements')
	let f_selectors_accessibility = feature_active(features, 'selectors.accessibility')
	let f_selectors_attributes = feature_active(features, 'selectors.attributes')
	let f_selectors_customelements = feature_active(features, 'selectors.customElements')
	let f_selectors_keyframes = feature_active(features, 'selectors.keyframes')
	let f_selectors_prefixed = feature_active(features, 'selectors.prefixed')
	let f_selectors_combinators = feature_active(features, 'selectors.combinators')
	let f_declarations = feature_active(features, 'declarations')
	let f_declarations_importants = feature_active(features, 'declarations.importants')
	let f_declarations_complexity = feature_active(features, 'declarations.complexity')
	let f_declarations_nesting = feature_active(features, 'declarations.nesting')
	let f_declarations_nesting_items = feature_active(features, 'declarations.nesting.items')
	let f_properties = feature_active(features, 'properties')
	let f_properties_prefixed = feature_active(features, 'properties.prefixed')
	let f_properties_custom = feature_active(features, 'properties.custom')
	let f_properties_shorthands = feature_active(features, 'properties.shorthands')
	let f_properties_browserhacks = feature_active(features, 'properties.browserhacks')
	let f_properties_complexity = feature_active(features, 'properties.complexity')
	let f_values = feature_active(features, 'values')
	let f_values_colors = feature_active(features, 'values.colors')
	let f_values_gradients = feature_active(features, 'values.gradients')
	let f_values_fontFamilies = feature_active(features, 'values.fontFamilies')
	let f_values_fontSizes = feature_active(features, 'values.fontSizes')
	let f_values_lineHeights = feature_active(features, 'values.lineHeights')
	let f_values_zindexes = feature_active(features, 'values.zindexes')
	let f_values_textShadows = feature_active(features, 'values.textShadows')
	let f_values_boxShadows = feature_active(features, 'values.boxShadows')
	let f_values_borderRadiuses = feature_active(features, 'values.borderRadiuses')
	let f_values_animations = feature_active(features, 'values.animations')
	let f_values_prefixes = feature_active(features, 'values.prefixes')
	let f_values_browserhacks = feature_active(features, 'values.browserhacks')
	let f_values_units = feature_active(features, 'values.units')
	let f_values_complexity = feature_active(features, 'values.complexity')
	let f_values_keywords = feature_active(features, 'values.keywords')
	let f_values_resets = feature_active(features, 'values.resets')
	let f_values_displays = feature_active(features, 'values.displays')

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
	let functions = new Collection(useLocations)
	let scopes = new Collection(useLocations)
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
	let totalSelectors = 0
	let totalKeyframeSelectors = 0 // always counted for sourceLinesOfCode
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
	let pseudoElements = new Collection(useLocations)
	let attributeSelectors = new Collection(useLocations)
	let customElementSelectors = new Collection(useLocations)
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
	let shorthands = new Collection(useLocations)
	let propertyComplexities = new AggregateCollection()

	// Values
	let valueComplexities = new AggregateCollection()
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
			let normalized_name = basename(node.name ?? '')

			// Always detect keyframes for correct rule/declaration categorization,
			// regardless of whether atrules analysis is active
			let is_keyframes_rule = normalized_name.endsWith('keyframes')
			if (is_keyframes_rule && node.prelude !== null && node.prelude !== undefined) {
				keyframesDepth = depth
			}

			if (!f_atrules) return

			let atruleLoc = toLoc(node)

			if (f_atrules_nesting) {
				atruleNesting.push(depth)
				uniqueAtruleNesting.p(depth, atruleLoc)
			}

			atrules.p(normalized_name, atruleLoc)

			//#region @FONT-FACE
			if (normalized_name === 'font-face') {
				if (f_atrules_fontface) {
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
					fontfaces.push(descriptors)
				}
				if (f_atrules_complexity) {
					atRuleComplexities.push(1)
				}
			}
			//#endregion

			if (node.prelude === null || node.prelude === undefined) {
				if (normalized_name === 'layer') {
					// @layer without a prelude is anonymous
					if (f_atrules_layer) {
						layers.p('<anonymous>', toLoc(node))
					}
					if (f_atrules_complexity) {
						atRuleComplexities.push(2)
					}
				}
			} else {
				let complexity = 1

				// All the AtRules in here MUST have a prelude, so we can count their names
				if (normalized_name === 'media') {
					if (f_atrules_media) {
						medias.p(node.prelude.text, toLoc(node))
					}
					if (f_atrules_media_browserhacks) {
						isMediaBrowserhack(node.prelude, (hack) => {
							mediaBrowserhacks.p(hack, toLoc(node))
							complexity++
						})
					}
				} else if (normalized_name === 'supports') {
					if (f_atrules_supports) {
						supports.p(node.prelude.text, toLoc(node))
					}
					if (f_atrules_supports_browserhacks) {
						isSupportsBrowserhack(node.prelude, (hack) => {
							supportsBrowserhacks.p(hack, toLoc(node))
							complexity++
						})
					}
				} else if (is_keyframes_rule) {
					if (f_atrules_keyframes) {
						keyframes.p(node.prelude.text, toLoc(node))
					}
					if (f_atrules_keyframes_prefixed && node.is_vendor_prefixed) {
						prefixedKeyframes.p(`@${node.name?.toLowerCase()} ${node.prelude.text}`, toLoc(node))
						complexity++
					}
				} else if (normalized_name === 'layer') {
					if (f_atrules_layer) {
						for (let layer of node.prelude.text.split(',').map((s: string) => s.trim())) {
							layers.p(layer, toLoc(node))
						}
					}
				} else if (normalized_name === 'import') {
					if (f_atrules_import) {
						imports.p(node.prelude.text, toLoc(node))
						if (node.prelude.has_children) {
							for (let child of node.prelude) {
								if (child.type === SUPPORTS_QUERY && typeof child.value === 'string') {
									if (f_atrules_supports) supports.p(child.value, toLoc(child))
								} else if (child.type === LAYER_NAME && typeof child.value === 'string') {
									if (f_atrules_layer) layers.p(child.value, toLoc(child))
								}
							}
						}
					}
				} else if (normalized_name === 'container') {
					if (f_atrules_container) {
						containers.p(node.prelude.text, toLoc(node))
						if (f_atrules_container_names && node.prelude.first_child?.type === CONTAINER_QUERY) {
							if (node.prelude.first_child.first_child?.type === IDENTIFIER) {
								containerNames.p(node.prelude.first_child.first_child.text, toLoc(node))
							}
						}
					}
				} else if (normalized_name === 'property') {
					if (f_atrules_property) {
						registeredProperties.p(node.prelude.text, toLoc(node))
					}
				} else if (normalized_name === 'function') {
					if (f_atrules_function) {
						let prelude = node.prelude.text
						let name = prelude.includes('(') ? prelude.slice(0, prelude.indexOf('(')).trim() : prelude.trim()
						functions.p(name, toLoc(node))
					}
				} else if (normalized_name === 'charset') {
					if (f_atrules_charset) {
						charsets.p(node.prelude.text.toLowerCase(), toLoc(node))
					}
				} else if (normalized_name === 'scope') {
					if (f_atrules_scope) {
						scopes.p(node.prelude.text, toLoc(node))
					}
				}

				if (f_atrules_complexity) {
					atRuleComplexities.push(complexity)
				}
			}
		} else if (node.type === STYLE_RULE) {
			// Handle keyframe rules specially
			if (inKeyframes && node.prelude) {
				if (node.prelude.type === SELECTOR_LIST && node.prelude.children.length > 0) {
					// Always count for sourceLinesOfCode
					totalKeyframeSelectors += node.prelude.children.length
					if (f_selectors_keyframes) {
						for (let keyframe_selector of node.prelude.children) {
							keyframeSelectors.p(keyframe_selector.text, toLoc(keyframe_selector))
						}
					}
				}
				// Don't count keyframe rules as regular rules, but continue walking
				// children to count declarations inside keyframes
				// (Declarations are counted in the Declaration handler below)
			} else if (f_rules) {
				// Only count non-keyframe rules
				totalRules++

				// Check if rule is empty (no declarations in block)
				if (f_rules_empty && node.block?.is_empty) {
					emptyRules++
				}

				if (f_rules_sizes || f_rules_selectors || f_rules_declarations) {
					// Count selectors and declarations in this rule
					let numSelectors = 0
					let numDeclarations = 0
					let loc = toLoc(node)

					// Find the SelectorList child and count Selector nodes inside it
					if (f_rules_selectors && node.prelude) {
						for (const selector of node.prelude.children) {
							if (selector.type === SELECTOR) {
								numSelectors++
							}
						}
					}

					// Count declarations in the block
					if (f_rules_declarations && node.block) {
						for (const declaration of node.block.children) {
							if (declaration.type === DECLARATION) {
								numDeclarations++
							}
						}
					}

					// Track rule metrics
					if (f_rules_sizes) {
						ruleSizes.push(numSelectors + numDeclarations)
						uniqueRuleSize.p(numSelectors + numDeclarations, loc)
					}

					if (f_rules_selectors) {
						selectorsPerRule.push(numSelectors)
						uniqueSelectorsPerRule.p(numSelectors, loc)
					}

					if (f_rules_declarations) {
						declarationsPerRule.push(numDeclarations)
						uniqueDeclarationsPerRule.p(numDeclarations, loc)
					}
				}

				if (f_rules_nesting) {
					let loc = toLoc(node)
					ruleNesting.push(depth)
					uniqueRuleNesting.p(depth, loc)
				}
			}
		} else if (node.type === SELECTOR) {
			// Keyframe selectors are now handled at the Rule level, so skip them here
			if (inKeyframes) {
				return SKIP
			}

			totalSelectors++

			if (!f_selectors) {
				return SKIP
			}

			let loc = toLoc(node)

			uniqueSelectors.add(node.text)

			if (f_selectors_nesting) {
				selectorNesting.push(depth > 0 ? depth - 1 : 0)
				uniqueSelectorNesting.p(depth > 0 ? depth - 1 : 0, loc)
			}

			if (f_selectors_complexity) {
				let complexity = getComplexity(node)
				selectorComplexities.push(complexity)
				uniqueSelectorComplexities.p(complexity, loc)
			}

			if (f_selectors_prefixed) {
				isPrefixed(node, (prefix) => {
					prefixedSelectors.p(prefix.toLowerCase(), loc)
				})
			}

			if (f_selectors_accessibility) {
				// Check for accessibility selectors
				isAccessibility(node, (a11y_selector) => {
					a11y.p(a11y_selector, loc)
				})
			}

			if (f_selectors_attributes || f_selectors_customelements || f_selectors_pseudoclasses || f_selectors_pseudoelements) {
				walk(node, (child) => {
					if (f_selectors_attributes && child.type === ATTRIBUTE_SELECTOR) {
						attributeSelectors.p(child.name?.toLowerCase() ?? '', loc)
					} else if (f_selectors_customelements && child.type === TYPE_SELECTOR && !child.name?.startsWith('--') && child.name?.includes('-')) {
						customElementSelectors.p(child.name.toLowerCase(), loc)
					} else if (f_selectors_pseudoclasses && child.type === PSEUDO_CLASS_SELECTOR) {
						pseudoClasses.p(child.name?.toLowerCase() ?? '', loc)
					} else if (f_selectors_pseudoelements && child.type === PSEUDO_ELEMENT_SELECTOR) {
						pseudoElements.p(child.name?.toLowerCase() ?? '', loc)
					}
				})
			}

			if (f_selectors_combinators) {
				getCombinators(node, (combinator) => {
					let name = combinator.name.trim() === '' ? ' ' : combinator.name
					combinators.p(name, combinator.loc)
				})
			}

			if (f_selectors_specificity) {
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

				if (f_selectors_specificity_items) {
					specificities.push(specificity)
				}

				if (f_selectors_id && sa > 0) {
					ids.p(node.text, loc)
				}
			}

			// Avoid deeper walking of selectors to not mess with
			// our specificity calculations in case of a selector
			// with :where() or :is() that contain SelectorLists
			// as children
			return SKIP
		} else if (node.type === DECLARATION) {
			// Always count for sourceLinesOfCode; gate heavy work below
			totalDeclarations++

			if (!f_declarations && !f_properties && !f_values) return

			if (f_declarations) {
				uniqueDeclarations.add(node.text)
			}

			let loc = toLoc(node)

			if (f_declarations_nesting) {
				let declarationDepth = depth > 0 ? depth - 1 : 0
				declarationNesting.push(declarationDepth)
				uniqueDeclarationNesting.p(declarationDepth, loc)
			}

			if (f_declarations_complexity || f_declarations_importants || f_values_browserhacks) {
				let complexity = 1
				if (node.is_important) {
					complexity++

					if (f_declarations_importants || f_values_browserhacks) {
						let declaration = node.text
						if (f_values_browserhacks && !declaration.toLowerCase().includes('!important')) {
							valueBrowserhacks.p('!ie', toLoc(node.value as CSSNode))
						}

						if (f_declarations_importants && inKeyframes) {
							importantsInKeyframes++
							complexity++
						}
					}
				}
				if (f_declarations_complexity) {
					declarationComplexities.push(complexity)
				}
			}

			if (f_declarations_importants && node.is_important) {
				importantDeclarations++
			}

			//#region PROPERTIES
			let { is_important, property, is_browserhack, is_vendor_prefixed } = node

			if (!property) return

			let propertyLoc = toLoc(node)
			propertyLoc.length = property.length
			let normalizedProperty = basename(property)

			if (f_properties) {
				properties.p(normalizedProperty, propertyLoc)

				// Count important declarations
				if (f_properties_prefixed && is_vendor_prefixed) {
					if (f_properties_complexity) propertyComplexities.push(2)
					propertyVendorPrefixes.p(property, propertyLoc)
				} else if (f_properties_custom && is_custom(property)) {
					customProperties.p(property, propertyLoc)
					if (f_properties_complexity) propertyComplexities.push(is_important ? 3 : 2)
					if (is_important) {
						importantCustomProperties.p(property, propertyLoc)
					}
				} else if (f_properties_browserhacks && is_browserhack) {
					propertyHacks.p(property.charAt(0), propertyLoc)
					if (f_properties_complexity) propertyComplexities.push(2)
				} else if (f_properties_complexity) {
					propertyComplexities.push(1)
				}

				if (f_properties_shorthands && shorthand_properties.has(normalizedProperty)) {
					shorthands.p(property, propertyLoc)
				}
			}
			//#endregion PROPERTIES

			if (!f_values) return

			//#region VALUES
			// Values are analyzed inside declaration because we need context, like which property is used
			{
				let value = node.value as CSSNode

				let { text } = value
				let valueLoc = toLoc(value)
				let complexity = 1

				// auto, inherit, initial, none, etc.
				if (keywords.has(text)) {
					if (f_values_keywords) valueKeywords.p(text.toLowerCase(), valueLoc)
					if (f_values_complexity) valueComplexities.push(complexity)

					if (f_values_displays && normalizedProperty === 'display') {
						displays.p(text.toLowerCase(), valueLoc)
					}

					return
				}

				//#region VALUE COMPLEXITY
				// i.e. `background-image: -webkit-linear-gradient()`
				if (f_values_prefixes || f_values_complexity) {
					isValuePrefixed(value, (prefixed) => {
						if (f_values_prefixes) vendorPrefixedValues.p(prefixed.toLowerCase(), valueLoc)
						complexity++
					})
				}

				// i.e. `property: value\9`
				if (f_values_browserhacks || f_values_complexity) {
					if (isIe9Hack(value)) {
						if (f_values_browserhacks) valueBrowserhacks.p('\\9', valueLoc)
						text = text.slice(0, -2)
						complexity++
					}
				}
				//#endregion VALUE COMPLEXITY

				if (f_values_complexity) {
					valueComplexities.push(complexity)
				}

				// Process properties first that don't have colors,
				// so we can avoid further walking them;
				if (f_values_resets && SPACING_RESET_PROPERTIES.has(normalizedProperty)) {
					if (isValueReset(value)) {
						resets.p(normalizedProperty, valueLoc)
					}
				} else if (f_values_displays && normalizedProperty === 'display') {
					if (/var\(/i.test(text)) {
						displays.p(text, valueLoc)
					} else {
						displays.p(text.toLowerCase(), valueLoc)
					}
				} else if (f_values_zindexes && normalizedProperty === 'z-index') {
					zindex.p(text, valueLoc)
					return SKIP
				} else if (normalizedProperty === 'font') {
					if (!SYSTEM_FONTS.has(text)) {
						let result = destructure(value, function (keyword) {
							if (f_values_keywords) valueKeywords.p(keyword.toLowerCase(), valueLoc)
						})

						if (!result) {
							return SKIP
						}

						let { font_size, line_height, font_family } = result
						if (f_values_fontFamilies && font_family) {
							fontFamilies.p(font_family, valueLoc)
						}

						if (f_values_fontSizes && font_size) {
							fontSizes.p(font_size.toLowerCase(), valueLoc)
						}

						if (f_values_lineHeights && line_height) {
							lineHeights.p(line_height.toLowerCase(), valueLoc)
						}
					}
					// Don't return SKIP here - let walker continue to find
					// units, colors, and font families in var() fallbacks
				} else if (f_values_fontSizes && normalizedProperty === 'font-size') {
					if (!SYSTEM_FONTS.has(text)) {
						let normalized = text.toLowerCase()
						if (normalized.includes('var(')) {
							fontSizes.p(text, valueLoc)
						} else {
							fontSizes.p(normalized, valueLoc)
						}
					}
				} else if (normalizedProperty === 'font-family') {
					if (f_values_fontFamilies && !SYSTEM_FONTS.has(text)) {
						fontFamilies.p(text, valueLoc)
					}
					return SKIP // to prevent finding color false positives (Black as font family name is not a color)
				} else if (f_values_lineHeights && normalizedProperty === 'line-height') {
					let normalized = text.toLowerCase()
					if (normalized.includes('var(')) {
						lineHeights.p(text, valueLoc)
					} else {
						lineHeights.p(normalized, valueLoc)
					}
				} else if (f_values_animations && (normalizedProperty === 'transition' || normalizedProperty === 'animation')) {
					analyzeAnimation(value.children, function (item) {
						if (item.type === 'fn') {
							timingFunctions.p(item.value.text.toLowerCase(), valueLoc)
						} else if (item.type === 'duration') {
							durations.p(item.value.text.toLowerCase(), valueLoc)
						} else if (item.type === 'keyword') {
							if (f_values_keywords) valueKeywords.p(item.value.text.toLowerCase(), valueLoc)
						}
					})
					return SKIP
				} else if (f_values_animations && (normalizedProperty === 'animation-duration' || normalizedProperty === 'transition-duration')) {
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
				} else if (f_values_animations && (normalizedProperty === 'transition-timing-function' || normalizedProperty === 'animation-timing-function')) {
					for (let child of value.children) {
						if (child.type !== OPERATOR) {
							timingFunctions.p(child.text, valueLoc)
						}
					}
				} else if (f_atrules_container_names && normalizedProperty === 'container-name') {
					containerNames.p(text, valueLoc)
				} else if (f_atrules_container_names && normalizedProperty === 'container') {
					// The first identifier in the `container` shorthand is the container name
					// Example: container: my-layout / inline-size;
					if (value.first_child?.type === IDENTIFIER) {
						containerNames.p(value.first_child.text, valueLoc)
					}
				} else if (f_values_borderRadiuses && border_radius_properties.has(normalizedProperty)) {
					borderRadiuses.push(text, property, valueLoc)
				} else if (f_values_textShadows && normalizedProperty === 'text-shadow') {
					textShadows.p(text, valueLoc)
				} else if (f_values_boxShadows && normalizedProperty === 'box-shadow') {
					boxShadows.p(text, valueLoc)
				}

				if (!f_values_colors && !f_values_units && !f_values_keywords && !f_values_gradients) return

				// Check if the value has an IE9 browserhack before walking
				let valueHasIe9Hack = f_values_colors && isIe9Hack(value)

				walk(value, (valueNode) => {
					switch (valueNode.type) {
						case DIMENSION: {
							if (!f_values_units) return SKIP
							let unit = valueNode.unit?.toLowerCase() ?? ''
							let loc = toLoc(valueNode)
							units.push(unit, property, loc)
							return SKIP
						}
						case HASH: {
							if (!f_values_colors) return SKIP
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
							// 2. Duplicate keywords (already extracted by destructure)
							if (normalizedProperty === 'font' || normalizedProperty === 'font-family') {
								return SKIP
							}

							if (f_values_keywords && keywords.has(identifierText)) {
								valueKeywords.p(identifierText.toLowerCase(), identifierLoc)
							}

							if (!f_values_colors) return SKIP

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
							if (!f_values_colors && !f_values_gradients) return
							let funcName = valueNode.name as string
							let funcLoc = toLoc(valueNode)

							// rgb(a), hsl(a), color(), hwb(), lch(), lab(), oklab(), oklch()
							if (f_values_colors && colorFunctions.has(funcName)) {
								colors.push(valueNode.text, property, funcLoc)
								colorFormats.p(funcName.toLowerCase(), funcLoc)
								return
							}

							if (f_values_gradients && endsWith('gradient', funcName)) {
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
			if (!f_stylesheet_embedded) return
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
			if (f_atrules_media_features && node.property) {
				mediaFeatures.p(node.property.toLowerCase(), toLoc(node))
			}
			return SKIP
		}
	})

	let totalUniqueDeclarations = uniqueDeclarations.size

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
			sourceLinesOfCode: atruleCount.total + totalSelectors + totalDeclarations + totalKeyframeSelectors,
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
			function: functions.c(),
			scope: scopes.c(),
			complexity: atRuleComplexity,
			nesting: assign(
				atruleNesting.aggregate(),
				{
					items: f_atrules_nesting_items ? atruleNesting.toArray() : [],
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
					items: f_rules_sizes_items ? ruleSizes.toArray() : [],
				},
				uniqueRuleSize.c(),
			),
			nesting: assign(
				ruleNesting.aggregate(),
				{
					items: f_rules_nesting_items ? ruleNesting.toArray() : [],
				},
				uniqueRuleNesting.c(),
			),
			selectors: assign(
				selectorsPerRule.aggregate(),
				{
					items: f_rules_selectors_items ? selectorsPerRule.toArray() : [],
				},
				uniqueSelectorsPerRule.c(),
			),
			declarations: assign(
				declarationsPerRule.aggregate(),
				{
					items: f_rules_declarations_items ? declarationsPerRule.toArray() : [],
				},
				uniqueDeclarationsPerRule.c(),
			),
		},
		selectors: {
			total: f_selectors ? totalSelectors : 0,
			totalUnique: totalUniqueSelectors,
			uniquenessRatio: ratio(totalUniqueSelectors, f_selectors ? totalSelectors : 0),
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
				items: f_selectors_complexity_items ? selectorComplexities.toArray() : [],
			}),
			nesting: assign(
				selectorNesting.aggregate(),
				{
					items: f_selectors_nesting_items ? selectorNesting.toArray() : [],
				},
				uniqueSelectorNesting.c(),
			),
			id: assign(ids.c(), {
				ratio: ratio(ids.size(), f_selectors ? totalSelectors : 0),
			}),
			pseudoClasses: pseudoClasses.c(),
			pseudoElements: pseudoElements.c(),
			accessibility: assign(a11y.c(), {
				ratio: ratio(a11y.size(), f_selectors ? totalSelectors : 0),
			}),
			attributes: attributeSelectors.c(),
			customElements: customElementSelectors.c(),
			keyframes: keyframeSelectors.c(),
			prefixed: assign(prefixedSelectors.c(), {
				ratio: ratio(prefixedSelectors.size(), f_selectors ? totalSelectors : 0),
			}),
			combinators: combinators.c(),
		},
		declarations: {
			total: f_declarations ? totalDeclarations : 0,
			totalUnique: totalUniqueDeclarations,
			uniquenessRatio: ratio(totalUniqueDeclarations, f_declarations ? totalDeclarations : 0),
			importants: {
				total: importantDeclarations,
				ratio: ratio(importantDeclarations, f_declarations ? totalDeclarations : 0),
				inKeyframes: {
					total: importantsInKeyframes,
					ratio: ratio(importantsInKeyframes, importantDeclarations),
				},
			},
			complexity: declarationComplexity,
			nesting: assign(
				declarationNesting.aggregate(),
				{
					items: f_declarations_nesting_items ? declarationNesting.toArray() : [],
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
			shorthands: assign(shorthands.c(), {
				ratio: ratio(shorthands.size(), properties.size()),
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
