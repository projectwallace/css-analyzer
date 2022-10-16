import { isCustom } from "./properties/property-utils.js"

/**
 *
 * @param {Object} result
 * @returns {Object} updatedResult
 */
export function normalize(result) {
	let version = getVersion(result)

	if (version === 4) {
		return polyfillFrom4(result)
	}

	if (version === 5) {
		// Polyfill newly added features
		return polyfillFrom5(result)
	}

	return createV5Result()
}

function getVersion(result) {
	if ('__meta__' in result) {
		return 5
	}

	if ('stylesheets' in result) {
		return 4
	}

	if ('rules.total' in result) {
		return 2
	}

	// V1 had values.total from the start
	if ('values' in result && 'total' in result.values) {
		return 1
	}
}
function polyfillFrom5(result) {
	// v5.1.0: Embedded content added
	if (!('embeddedContent' in result.stylesheet)) {
		result.stylesheet.embeddedContent = {
			total: 0,
			totalUnique: 0,
			unique: {},
			uniquenessRatio: 0,
			size: {
				total: 0,
				ratio: 0,
			}
		}
	}

	// v5.2.0: @layer added
	if (!('layer' in result.atrules)) {
		result.atrules.layer = {
			total: 0,
			totalUnique: 0,
			unique: {},
			uniquenessRatio: 0,
		}
	}

	// v5.5.0: RuleSet sizes
	if (!('sizes' in result.rules)) {
		result.rules.sizes = {
			min: 0,
			max: 0,
			mean: 0,
			mode: 0,
			median: 0,
			range: 0,
			sum: 0,
			items: [],
			unique: {},
			totalUnique: 0,
			uniquenessRatio: 0,
		}
	}

	// v5.5.0:
	// - count unique selectors per rule
	// - count unique declarations per rule
	if (!('unique' in result.rules.selectors)) {
		result.rules.selectors.unique = {}
		result.rules.selectors.totalUnique = 0
		result.rules.selectors.uniquenessRatio = 0
		result.rules.declarations.unique = {}
		result.rules.declarations.totalUnique = 0
		result.rules.declarations.uniquenessRatio = 0
	}

	// v5.5.0: Selector specificity uniqueness
	if (!('totalUnique' in result.selectors.specificity)) {
		result.selectors.specificity.unique = {}
		result.selectors.specificity.totalUnique = 0
		result.selectors.specificity.uniquenessRatio = 0
	}

	return result
}

function convertV4UniqueList(list) {
	let unique = {}

	for (let i = 0; i < list.length; i++) {
		let item = list[i]
		unique[item.value] = item.count
	}

	return unique
}

function createCountableCollection() {
	return {
		total: 0,
		totalUnique: 0,
		uniquenessRatio: 0,
		unique: {}
	}
}

function createAggregateCollection() {
	return {
		max: 0,
		min: 0,
		range: 0,
		mean: 0,
		median: 0,
		mode: 0,
		sum: 0,
	}
}

function createSpecificity() {
	return [0, 0, 0]
}

function createV5Result() {
	return {
		stylesheet: {
			sourceLinesOfCode: 0,
			linesOfCode: 0,
			size: 0,
			comments: {
				total: 0,
				size: 0,
			},
			embeddedContent: Object.assign(
				createCountableCollection(),
				{
					size: {
						total: 0,
						ratio: 0,
					},
				}
			),
		},
		atrules: {
			fontface: {
				total: 0,
				totalUnique: 0,
				unique: {},
				uniquenessRatio: 0,
			},
			import: {},
			media: {},
			charset: {},
			supports: {
				browserhacks: {},
			},
			keyframes: {},
			container: createCountableCollection(),
			layer: createCountableCollection(),
		},
		rules: {
			total: 0,
			empty: {
				total: 0,
				ratio: 0,
			},
			sizes: Object.assign(
				createAggregateCollection(),
				{
					items: [],
					unique: {},
					totalUnique: 0,
					uniquenessRatio: 0,
				},
			),
			selectors: Object.assign(
				createAggregateCollection(),
				{
					items: [],
					unique: {},
					totalUnique: 0,
					uniquenessRatio: 0,
				},
			),
			declarations: Object.assign(
				createAggregateCollection(),
				{
					items: [],
					unique: {},
					totalUnique: 0,
					uniquenessRatio: 0,
				},
			),
		},
		selectors: {
			total: 0,
			totalUnique: 0,
			uniquenessRatio: 0,
			specificity: {
				min: createSpecificity(),
				max: createSpecificity(),
				sum: createSpecificity(),
				mean: createSpecificity(),
				mode: createSpecificity(),
				median: createSpecificity(),
				items: [],
				unique: {},
				totalUnique: 0,
				uniquenessRatio: 0,
			},
			complexity: Object.assign(
				createAggregateCollection(),
				createCountableCollection(),
				{
					items: [],
				}
			),
			id: Object.assign(
				createCountableCollection(),
				{
					ratio: 0,
				}
			),
			accessibility: Object.assign(
				createCountableCollection(),
				{
					ratio: 0,
				}
			),
			keyframes: createCountableCollection(),
		},
		declarations: {
			total: 0,
			totalUnique: 0,
			uniquenessRatio: 0,
			unique: {
				total: 0,
				ratio: 0,
			},
			importants: {
				total: 0,
				ratio: 0,
				inKeyframes: {
					total: 0,
					ratio: 0,
				},
			},
		},
		properties: {},
		values: {
			animations: {},
			units: createCountableCollection(),
		},
		__meta__: {
			parseTime: 0,
			analyzeTime: 0,
			total: 0,
		}
	}
}

function ratio(part, total) {
	if (total === 0) return 0
	return part / total
}

function convertV4CountableCollection(v4Countable) {
	return {
		total: v4Countable.total,
		totalUnique: v4Countable.totalUnique,
		unique: convertV4UniqueList(v4Countable.unique),
		uniquenessRatio: ratio(v4Countable.totalUnique, v4Countable.total),
	}
}

function polyfillFrom4(previous) {
	let next = createV5Result()

	// stylesheet
	next.stylesheet.sourceLinesOfCode = previous.stylesheets.linesOfCode.sourceLinesOfCode.total
	next.stylesheet.linesOfCode = previous.stylesheets.linesOfCode.total
	next.stylesheet.size = previous.stylesheets.size.uncompressed.totalBytes

	// atrules
	// - fontface
	next.atrules.fontface.total = previous.atrules.fontfaces.total
	next.atrules.fontface.totalUnique = previous.atrules.fontfaces.totalUnique
	next.atrules.fontface.unique = previous.atrules.fontfaces.unique.map(item => {
		// convert [{property, value}] to {property:value}
		return item.value.reduce((acc, curr) => {
			acc[curr.property] = curr.value
			return acc
		}, {})
	})
	next.atrules.fontface.uniquenessRatio = ratio(previous.atrules.fontfaces.totalUnique, previous.atrules.fontfaces.total)
	// - import
	next.atrules.import = convertV4CountableCollection(previous.atrules.imports)
	// - media
	next.atrules.media = convertV4CountableCollection(previous.atrules.mediaqueries)
	next.atrules.media.browserhacks = convertV4CountableCollection(previous.atrules.mediaqueries.browserhacks)
	// - keyframes
	next.atrules.keyframes = convertV4CountableCollection(previous.atrules.keyframes)
	next.atrules.keyframes.prefixed = convertV4CountableCollection(previous.atrules.keyframes.prefixed)
	next.atrules.keyframes.prefixed.ratio = ratio(previous.atrules.keyframes.prefixed.total, previous.atrules.keyframes.total)
	// - charset
	next.atrules.charset = convertV4CountableCollection(previous.atrules.charsets)
	// - supports
	next.atrules.supports = convertV4CountableCollection(previous.atrules.supports)
	next.atrules.supports.browserhacks = createCountableCollection()

	// rules
	next.rules.total = previous.rules.total
	next.rules.empty.total = previous.rules.empty.total
	next.rules.empty.ratio = ratio(next.rules.empty.total, next.rules.total)
	next.rules.selectors.max = previous.rules.selectors.maximum.count
	next.rules.selectors.min = 1
	next.rules.selectors.range = previous.rules.selectors.maximum.count - 1
	next.rules.selectors.mean = ratio(previous.selectors.total, previous.rules.total)
	next.rules.declarations.max = previous.stylesheets.cohesion.min.count
	next.rules.declarations.mean = ratio(previous.declarations.total, previous.rules.total)

	// selectors
	next.selectors.total = previous.selectors.total
	next.selectors.totalUnique = previous.selectors.totalUnique
	next.selectors.uniquenessRatio = ratio(next.selectors.totalUnique, next.selectors.total)
	next.selectors.specificity.max = [
		previous.selectors.specificity.max.value.b,
		previous.selectors.specificity.max.value.c,
		previous.selectors.specificity.max.value.d,
	]
	next.selectors.complexity.max = previous.selectors.complexity.max.value
	next.selectors.complexity.sum = previous.selectors.complexity.sum
	next.selectors.complexity.mean = ratio(previous.selectors.complexity.sum, previous.selectors.total)
	next.selectors.complexity.totalUnique = previous.selectors.complexity.unique.length
	next.selectors.complexity.unique = convertV4UniqueList(previous.selectors.complexity.unique)
	next.selectors.id = convertV4CountableCollection(previous.selectors.id)
	next.selectors.id.ratio = ratio(previous.selectors.id.total, previous.selectors.total)
	next.selectors.accessibility = convertV4CountableCollection(previous.selectors.accessibility)

	// declarations
	next.declarations.total = previous.declarations.total
	next.declarations.totalUnique = previous.declarations.totalUnique
	next.declarations.uniquenessRatio = ratio(next.declarations.totalUnique, next.declarations.total)
	next.declarations.unique = {
		total: next.declarations.totalUnique,
		ratio: next.declarations.uniquenessRatio,
	}
	next.declarations.importants.total = previous.declarations.importants.total
	next.declarations.importants.ratio = previous.declarations.importants.share

	// properties
	next.properties = convertV4CountableCollection(previous.properties)
	next.properties.prefixed = convertV4CountableCollection(previous.properties.prefixed)
	next.properties.prefixed.ratio = ratio(next.properties.prefixed.total, next.properties.total)
	next.properties.custom = createCountableCollection()
	previous.properties.unique
		.filter(item => isCustom(item.value))
		.map(item => {
			next.properties.custom.total += item.count
			next.properties.custom.totalUnique += 1
			next.properties.custom.unique[item.value] = item.count
		})
	next.properties.custom.uniquenessRatio = ratio(next.properties.custom.totalUnique, next.properties.custom.total)
	next.properties.custom.ratio = ratio(next.properties.custom.total, next.properties.total)
	next.properties.browserhacks = convertV4CountableCollection(previous.properties.browserhacks)
	next.properties.browserhacks.ratio = ratio(next.properties.browserhacks.total, next.properties.total)
	next.properties.complexity = createAggregateCollection()

	// values
	next.values.colors = convertV4CountableCollection(previous.values.colors)
	next.values.colors.itemsPerContext = {} // ContextCollection
	next.values.fontFamilies = convertV4CountableCollection(previous.values.fontfamilies)
	next.values.fontSizes = convertV4CountableCollection(previous.values.fontsizes)
	next.values.zindexes = convertV4CountableCollection(previous.values.zindexes)
	next.values.textShadows = convertV4CountableCollection(previous.values.textshadows)
	next.values.boxShadows = convertV4CountableCollection(previous.values.boxshadows)
	next.values.animations.durations = convertV4CountableCollection(previous.values.animations.durations)
	next.values.animations.timingFunctions = convertV4CountableCollection(previous.values.animations.timingFunctions)
	next.values.prefixes = convertV4CountableCollection(previous.values.prefixed)
	next.values.browserhacks = convertV4CountableCollection(previous.values.browserhacks)

	return next
}
