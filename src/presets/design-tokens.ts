import { analyze } from '../engine/analyzer.ts'
import type {
	CSSNode,
	CollectorDef,
	ContextCountResult,
	CountOptions,
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
	border_radiuses: CollectorDef<ContextCountResult>
	durations: CollectorDef<CountResult>
	timing_functions: CollectorDef<CountResult>
}

export type DesignTokens = ResultOf<DesignTokensCollectors>

/** Options for the whole set, passed on to every collector */
export type DesignTokensOptions = Pick<CountOptions, 'locations'>

/**
 * Everything a design-token extractor needs. Spread it to add your own collectors:
 * `{ ...design_tokens_collectors({ locations: true }), z_indexes: z_indexes() }`.
 */
export function design_tokens_collectors(
	options: DesignTokensOptions = {},
): DesignTokensCollectors {
	const { locations } = options
	return {
		colors: colors({ contexts: true, locations }),
		font_sizes: font_sizes({ locations }),
		font_families: font_families({ locations }),
		line_heights: line_heights({ locations }),
		gradients: gradients({ locations }),
		box_shadows: box_shadows({ locations }),
		border_radiuses: border_radiuses({ contexts: true, locations }),
		durations: durations({ locations }),
		timing_functions: timing_functions({ locations }),
	}
}

export function analyze_design_tokens(
	input: string | CSSNode,
	options?: DesignTokensOptions,
): DesignTokens {
	return analyze(input, design_tokens_collectors(options))
}
