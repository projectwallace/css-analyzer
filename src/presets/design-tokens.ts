import { analyze } from '../engine/analyzer.ts'
import type {
	CSSNode,
	CollectorDef,
	ContextCountResult,
	CountResult,
	ResultOf,
} from '../engine/types.ts'
import {
	border_radiuses,
	box_shadows,
	colors,
	durations,
	font_families,
	font_sizes,
	gradients,
	line_heights,
	timing_functions,
} from '../collectors/index.ts'
import type { ColorsResult } from '../collectors/colors.ts'

export type DesignTokensCollectors = {
	colors: CollectorDef<ColorsResult>
	font_sizes: CollectorDef<CountResult>
	font_families: CollectorDef<CountResult>
	line_heights: CollectorDef<CountResult>
	gradients: CollectorDef<CountResult>
	box_shadows: CollectorDef<CountResult>
	radii: CollectorDef<ContextCountResult>
	durations: CollectorDef<CountResult>
	easings: CollectorDef<CountResult>
}

export type DesignTokens = ResultOf<DesignTokensCollectors>

/** Everything a design-token extractor needs. Spread it to add your own collectors. */
export const design_tokens_collectors: DesignTokensCollectors = {
	colors: colors({ contexts: true }),
	font_sizes: font_sizes(),
	font_families: font_families(),
	line_heights: line_heights(),
	gradients: gradients(),
	box_shadows: box_shadows(),
	radii: border_radiuses({ contexts: true }),
	durations: durations(),
	easings: timing_functions(),
}

export function analyze_design_tokens(input: string | CSSNode): DesignTokens {
	return analyze(input, design_tokens_collectors)
}
