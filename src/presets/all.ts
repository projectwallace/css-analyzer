import { analyze } from '../engine/analyzer.ts'
import type { CollectorDef, ContextCountResult, CountOptions, ResultOf } from '../engine/types.ts'
import type { ColorsResult } from '../collectors/colors.ts'
import {
	animation_names,
	atrules,
	border_radiuses,
	box_shadows,
	colors,
	declarations,
	displays,
	durations,
	font_families,
	font_sizes,
	gradients,
	keywords,
	line_heights,
	properties,
	resets,
	rules,
	selectors,
	specificity,
	stylesheet,
	text_shadows,
	timing_functions,
	units,
	value_browserhacks,
	value_complexity,
	value_prefixes,
	z_indexes,
} from '../collectors/index.ts'

export type AllCollectors = {
	stylesheet: ReturnType<typeof stylesheet>
	atrules: ReturnType<typeof atrules>
	rules: ReturnType<typeof rules>
	selectors: ReturnType<typeof selectors>
	specificity: ReturnType<typeof specificity>
	declarations: ReturnType<typeof declarations>
	properties: ReturnType<typeof properties>
	colors: CollectorDef<ColorsResult>
	font_sizes: ReturnType<typeof font_sizes>
	font_families: ReturnType<typeof font_families>
	line_heights: ReturnType<typeof line_heights>
	gradients: ReturnType<typeof gradients>
	box_shadows: ReturnType<typeof box_shadows>
	border_radiuses: CollectorDef<ContextCountResult>
	durations: ReturnType<typeof durations>
	timing_functions: ReturnType<typeof timing_functions>
	text_shadows: ReturnType<typeof text_shadows>
	z_indexes: ReturnType<typeof z_indexes>
	displays: ReturnType<typeof displays>
	animation_names: ReturnType<typeof animation_names>
	value_prefixes: ReturnType<typeof value_prefixes>
	value_browserhacks: ReturnType<typeof value_browserhacks>
	units: CollectorDef<ContextCountResult>
	value_complexity: ReturnType<typeof value_complexity>
	keywords: ReturnType<typeof keywords>
	resets: ReturnType<typeof resets>
}

/** Options for the whole set, passed on to every collector */
export type AllOptions = Pick<CountOptions, 'locations'>

/** Every collector, with per-property counts for colors, border radiuses and units */
export function all_collectors(options: AllOptions = {}): AllCollectors {
	const { locations } = options
	return {
		stylesheet: stylesheet({ locations }),
		atrules: atrules({ locations }),
		rules: rules({ locations }),
		selectors: selectors({ locations }),
		specificity: specificity({ locations }),
		declarations: declarations({ locations }),
		properties: properties({ locations }),
		colors: colors({ contexts: true, locations }),
		font_sizes: font_sizes({ locations }),
		font_families: font_families({ locations }),
		line_heights: line_heights({ locations }),
		gradients: gradients({ locations }),
		box_shadows: box_shadows({ locations }),
		border_radiuses: border_radiuses({ contexts: true, locations }),
		durations: durations({ locations }),
		timing_functions: timing_functions({ locations }),
		text_shadows: text_shadows({ locations }),
		z_indexes: z_indexes({ locations }),
		displays: displays({ locations }),
		animation_names: animation_names({ locations }),
		value_prefixes: value_prefixes({ locations }),
		value_browserhacks: value_browserhacks({ locations }),
		units: units({ contexts: true, locations }),
		value_complexity: value_complexity({ locations }),
		keywords: keywords({ locations }),
		resets: resets({ locations }),
	}
}

export type AllResult = ResultOf<AllCollectors>

/**
 * Run every collector. The result is flat: one key per collector (`result.colors`, `result.atrules`, ...).
 */
export function analyze_all(input: string, options?: AllOptions): AllResult {
	return analyze(input, all_collectors(options))
}
