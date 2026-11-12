import { analyze } from '../engine/analyzer.ts'
import type {
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
	text_shadows,
	timing_functions,
	units,
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
	text_shadows: CollectorDef<CountResult>
	units: CollectorDef<ContextCountResult>
}

export type DesignTokens = ResultOf<DesignTokensCollectors>

/** Options for the whole set, passed on to every collector */
export type DesignTokensOptions = Pick<CountOptions, 'locations'>

/** The collectors a design-token extractor needs. Spread it to add collectors or replace one with other options */
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
		text_shadows: text_shadows({ locations }),
		units: units({ contexts: true, locations }),
	}
}

export function analyze_design_tokens(input: string, options?: DesignTokensOptions): DesignTokens {
	return analyze(input, design_tokens_collectors(options))
}
