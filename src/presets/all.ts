import { analyze } from '../engine/analyzer.ts'
import type { CSSNode, ResultOf } from '../engine/types.ts'
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
	colors: ReturnType<typeof colors>
	font_sizes: ReturnType<typeof font_sizes>
	font_families: ReturnType<typeof font_families>
	line_heights: ReturnType<typeof line_heights>
	gradients: ReturnType<typeof gradients>
	box_shadows: ReturnType<typeof box_shadows>
	border_radiuses: ReturnType<typeof border_radiuses>
	durations: ReturnType<typeof durations>
	timing_functions: ReturnType<typeof timing_functions>
	text_shadows: ReturnType<typeof text_shadows>
	z_indexes: ReturnType<typeof z_indexes>
	displays: ReturnType<typeof displays>
	animation_names: ReturnType<typeof animation_names>
	value_prefixes: ReturnType<typeof value_prefixes>
	value_browserhacks: ReturnType<typeof value_browserhacks>
	units: ReturnType<typeof units>
	value_complexity: ReturnType<typeof value_complexity>
	keywords: ReturnType<typeof keywords>
	resets: ReturnType<typeof resets>
}

/** Every collector, with per-property counts for colors, border radiuses and units */
export const all_collectors: AllCollectors = {
	stylesheet: stylesheet(),
	atrules: atrules(),
	rules: rules(),
	selectors: selectors(),
	specificity: specificity(),
	declarations: declarations(),
	properties: properties(),
	colors: colors({ contexts: true }),
	font_sizes: font_sizes(),
	font_families: font_families(),
	line_heights: line_heights(),
	gradients: gradients(),
	box_shadows: box_shadows(),
	border_radiuses: border_radiuses({ contexts: true }),
	durations: durations(),
	timing_functions: timing_functions(),
	text_shadows: text_shadows(),
	z_indexes: z_indexes(),
	displays: displays(),
	animation_names: animation_names(),
	value_prefixes: value_prefixes(),
	value_browserhacks: value_browserhacks(),
	units: units({ contexts: true }),
	value_complexity: value_complexity(),
	keywords: keywords(),
	resets: resets(),
}

export type AllResult = ResultOf<AllCollectors>

/**
 * Run every collector. The result is flat: one key per collector (`result.colors`, `result.atrules`, ...).
 */
export function analyze_all(input: string | CSSNode): AllResult {
	return analyze(input, all_collectors)
}
