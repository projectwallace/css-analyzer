import { analyze } from '../engine/analyzer.js'
import { summarize_numbers } from '../engine/summary.js'
import type { AddOptions, CSSNode, ContextCountResult, CountResult } from '../engine/types.js'
import { summarize_specificity } from '../collectors/specificity.js'
import type { DefinedUsedResult } from '../defined-used.js'
import { all_collectors, type AllCollectors, type AllResult } from './all.js'
import {
	atrules,
	border_radiuses,
	colors,
	declarations,
	rules,
	selectors,
	specificity,
	units,
} from '../collectors/index.js'

type CompatCount = {
	total: number
	totalUnique: number
	unique: Record<string, number>
	uniquenessRatio: number
}
type CompatContextCount = CompatCount & { itemsPerContext: Record<string, CompatCount> }
type CompatAggregate = {
	min: number
	max: number
	mean: number
	mode: number
	range: number
	sum: number
}
type CompatSeries = CompatAggregate & CompatCount & { items: number[] }
type Ratio = { ratio: number }
type Specificity = [number, number, number]

export type CompatAnalysis = {
	stylesheet: {
		sourceLinesOfCode: number
		linesOfCode: number
		size: number
		complexity: number
		comments: { total: number; size: number }
		embeddedContent: {
			size: { total: number; ratio: number }
			types: {
				total: number
				totalUnique: number
				uniquenessRatio: number
				unique: Record<string, { size: number; count: number }>
			}
		}
	}
	atrules: CompatCount & {
		fontface: {
			total: number
			totalUnique: number
			unique: Record<string, string>[]
			uniquenessRatio: number
		}
		import: CompatCount
		media: CompatCount & { browserhacks: CompatCount; features: CompatCount }
		charset: CompatCount
		supports: CompatCount & { browserhacks: CompatCount }
		keyframes: CompatCount & DefinedUsedResult & { prefixed: CompatCount & Ratio }
		container: CompatCount & { names: CompatCount & DefinedUsedResult }
		layer: CompatCount & DefinedUsedResult
		property: CompatCount
		function: CompatCount
		scope: CompatCount
		complexity: CompatAggregate
		nesting: CompatSeries
	}
	rules: {
		total: number
		empty: { total: number; ratio: number }
		sizes: CompatSeries
		nesting: CompatSeries
		selectors: CompatSeries
		declarations: CompatSeries
	}
	selectors: {
		total: number
		totalUnique: number
		uniquenessRatio: number
		specificity: CompatCount & {
			min: Specificity
			max: Specificity
			sum: Specificity
			mean: Specificity
			mode: Specificity
			items: Specificity[]
		}
		complexity: CompatSeries
		nesting: CompatSeries
		id: CompatCount & Ratio
		pseudoClasses: CompatCount
		pseudoElements: CompatCount
		accessibility: CompatCount & Ratio
		attributes: CompatCount
		customElements: CompatCount
		keyframes: CompatCount
		prefixed: CompatCount & Ratio
		combinators: CompatCount
	}
	declarations: {
		total: number
		totalUnique: number
		uniquenessRatio: number
		importants: { total: number; ratio: number; inKeyframes: { total: number; ratio: number } }
		complexity: CompatAggregate
		nesting: CompatSeries
	}
	properties: CompatCount & {
		prefixed: CompatCount & Ratio
		custom: CompatCount & DefinedUsedResult & Ratio & { importants: CompatCount & Ratio }
		shorthands: CompatCount & Ratio
		browserhacks: CompatCount & Ratio
		complexity: CompatAggregate
		anchorNames: DefinedUsedResult
	}
	values: {
		colors: CompatContextCount & { formats: CompatCount }
		gradients: CompatCount
		fontFamilies: CompatCount
		fontSizes: CompatCount
		lineHeights: CompatCount
		zindexes: CompatCount
		textShadows: CompatCount
		boxShadows: CompatCount
		borderRadiuses: CompatContextCount
		animations: { durations: CompatCount; timingFunctions: CompatCount; names: CompatCount }
		prefixes: CompatCount
		browserhacks: CompatCount
		units: CompatContextCount
		complexity: CompatAggregate
		keywords: CompatCount
		resets: CompatCount
		displays: CompatCount
	}
}

function ratio(part: number, total: number): number {
	return total === 0 ? 0 : part / total
}

function count(result: CountResult): CompatCount {
	const unique: Record<string, number> = {}
	for (const [item, entry] of result.unique) unique[item] = entry.count
	return {
		total: result.total,
		totalUnique: result.total_unique,
		unique,
		uniquenessRatio: ratio(result.total_unique, result.total),
	}
}

function count_with_contexts(result: ContextCountResult): CompatContextCount {
	const items_per_context: Record<string, CompatCount> = {}
	for (const [context, counts] of result.by_context) items_per_context[context] = count(counts)
	return { ...count(result), itemsPerContext: items_per_context }
}

function aggregate(result: CountResult): CompatAggregate {
	const { min, max, mean, mode, range, sum } = summarize_numbers(result)
	return { min, max, mean, mode, range, sum }
}

function series(result: CountResult): CompatSeries {
	return {
		...aggregate(result),
		items: (result.sequence ?? []).map(Number),
		...count(result),
	}
}

function defined_used(result: DefinedUsedResult): DefinedUsedResult {
	return {
		defined: result.defined,
		used: result.used,
		unused: result.unused,
		unknown: result.unknown,
	}
}

/** Turn the flat collector results into the nested shape of the 9.x analyzer */
function to_compat(result: AllResult): CompatAnalysis {
	const { stylesheet, atrules, rules, selectors, declarations, properties } = result
	const total_selectors = selectors.total
	const specificity = summarize_specificity(result.specificity)
	const embedded = stylesheet.embedded
	const complexity_sum =
		aggregate(atrules.complexity).sum +
		aggregate(selectors.complexity).sum +
		aggregate(declarations.complexity).sum +
		aggregate(properties.complexity).sum +
		aggregate(result.value_complexity).sum

	return {
		stylesheet: {
			sourceLinesOfCode:
				atrules.total + total_selectors + declarations.total + selectors.keyframes.total,
			linesOfCode: stylesheet.lines,
			size: stylesheet.size,
			complexity: complexity_sum,
			comments: stylesheet.comments,
			embeddedContent: {
				size: { total: embedded.size, ratio: ratio(embedded.size, stylesheet.size) },
				types: {
					total: embedded.total,
					totalUnique: embedded.types.size,
					uniquenessRatio: ratio(embedded.types.size, embedded.total),
					unique: Object.fromEntries(
						[...embedded.types].map(([type, entry]) => [
							type,
							{ size: entry.size, count: entry.count },
						]),
					),
				},
			},
		},
		atrules: {
			...count(atrules),
			fontface: {
				total: atrules.font_faces.total,
				totalUnique: atrules.font_faces.total,
				unique: atrules.font_faces.items,
				uniquenessRatio: atrules.font_faces.total === 0 ? 0 : 1,
			},
			import: count(atrules.imports),
			media: {
				...count(atrules.media),
				browserhacks: count(atrules.media.browserhacks),
				features: count(atrules.media.features),
			},
			charset: count(atrules.charsets),
			supports: {
				...count(atrules.supports),
				browserhacks: count(atrules.supports.browserhacks),
			},
			keyframes: {
				...count(atrules.keyframes),
				...defined_used(atrules.keyframes),
				prefixed: {
					...count(atrules.keyframes.prefixed),
					ratio: ratio(atrules.keyframes.prefixed.total, atrules.keyframes.total),
				},
			},
			container: {
				...count(atrules.containers),
				names: { ...count(atrules.containers.names), ...defined_used(atrules.containers.names) },
			},
			layer: { ...count(atrules.layers), ...defined_used(atrules.layers) },
			property: count(atrules.properties),
			function: count(atrules.functions),
			scope: count(atrules.scopes),
			complexity: aggregate(atrules.complexity),
			nesting: series(atrules.nesting),
		},
		rules: {
			total: rules.total,
			empty: { total: rules.empty, ratio: ratio(rules.empty, rules.total) },
			sizes: series(rules.sizes),
			nesting: series(rules.nesting),
			selectors: series(rules.selectors),
			declarations: series(rules.declarations),
		},
		selectors: {
			total: total_selectors,
			totalUnique: selectors.total_unique,
			uniquenessRatio: ratio(selectors.total_unique, total_selectors),
			specificity: {
				min: specificity.min,
				max: specificity.max,
				sum: specificity.sum,
				mean: specificity.mean,
				mode: specificity.mode,
				items: (result.specificity.sequence ?? []).map(
					(item) => item.split(',').map(Number) as Specificity,
				),
				...count(result.specificity),
			},
			complexity: series(selectors.complexity),
			nesting: series(selectors.nesting),
			id: { ...count(selectors.ids), ratio: ratio(selectors.ids.total, total_selectors) },
			pseudoClasses: count(selectors.pseudo_classes),
			pseudoElements: count(selectors.pseudo_elements),
			accessibility: {
				...count(selectors.accessibility),
				ratio: ratio(selectors.accessibility.total, total_selectors),
			},
			attributes: count(selectors.attributes),
			customElements: count(selectors.custom_elements),
			keyframes: count(selectors.keyframes),
			prefixed: {
				...count(selectors.prefixed),
				ratio: ratio(selectors.prefixed.total, total_selectors),
			},
			combinators: count(selectors.combinators),
		},
		declarations: {
			total: declarations.total,
			totalUnique: declarations.total_unique,
			uniquenessRatio: ratio(declarations.total_unique, declarations.total),
			importants: {
				total: declarations.importants.total,
				ratio: ratio(declarations.importants.total, declarations.total),
				inKeyframes: {
					total: declarations.importants.in_keyframes,
					ratio: ratio(declarations.importants.in_keyframes, declarations.importants.total),
				},
			},
			complexity: aggregate(declarations.complexity),
			nesting: series(declarations.nesting),
		},
		properties: {
			...count(properties),
			prefixed: {
				...count(properties.prefixed),
				ratio: ratio(properties.prefixed.total, properties.total),
			},
			custom: {
				...count(properties.custom),
				...defined_used(properties.custom),
				ratio: ratio(properties.custom.total, properties.total),
				importants: {
					...count(properties.custom.importants),
					ratio: ratio(properties.custom.importants.total, properties.custom.total),
				},
			},
			shorthands: {
				...count(properties.shorthands),
				ratio: ratio(properties.shorthands.total, properties.total),
			},
			browserhacks: {
				...count(properties.browserhacks),
				ratio: ratio(properties.browserhacks.total, properties.total),
			},
			complexity: aggregate(properties.complexity),
			anchorNames: defined_used(properties.anchor_names),
		},
		values: {
			colors: { ...count_with_contexts(result.colors), formats: count(result.colors.formats) },
			gradients: count(result.gradients),
			fontFamilies: count(result.font_families),
			fontSizes: count(result.font_sizes),
			lineHeights: count(result.line_heights),
			zindexes: count(result.z_indexes),
			textShadows: count(result.text_shadows),
			boxShadows: count(result.box_shadows),
			borderRadiuses: count_with_contexts(result.border_radiuses),
			animations: {
				durations: count(result.durations),
				timingFunctions: count(result.timing_functions),
				names: count(result.animation_names),
			},
			prefixes: count(result.value_prefixes),
			browserhacks: count(result.value_browserhacks),
			units: count_with_contexts(result.units),
			complexity: aggregate(result.value_complexity),
			keywords: count(result.keywords),
			resets: count(result.resets),
			displays: count(result.displays),
		},
	}
}

/** All collectors, configured like 9.x: ordered `items` and properties named as written */
export const compat_collectors: AllCollectors = {
	...all_collectors,
	colors: colors({ contexts: true, property: 'as_written' }),
	border_radiuses: border_radiuses({ contexts: true, property: 'as_written' }),
	units: units({ contexts: true, property: 'as_written' }),
	atrules: atrules({ sequence: true }),
	rules: rules({ sequence: true }),
	selectors: selectors({ sequence: true }),
	specificity: specificity({ sequence: true }),
	declarations: declarations({ sequence: true }),
}

/**
 * The 9.x report: same nested shape and camelCase keys, without `useLocations` and `__meta__`. Prefer `analyze_all()` or single collectors for new code.
 */
export function analyze_compat(input: string | CSSNode, options?: AddOptions): CompatAnalysis {
	return to_compat(analyze(input, compat_collectors, options))
}
