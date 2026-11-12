// The built-in collectors. `analyze()` and `define_collector()` (to write your own) come from the package root;
// the types needed to write down a collector map are re-exported at the bottom so one import covers the signature.
export { colors, type ColorsOptions, type ColorsResult } from './colors.ts'
export { font_sizes, type FontSizesOptions } from './font-sizes.ts'
export { font_families, type FontFamiliesOptions } from './font-families.ts'
export { line_heights, type LineHeightsOptions } from './line-heights.ts'
export { gradients } from './gradients.ts'
export { box_shadows } from './box-shadows.ts'
export { border_radiuses } from './border-radiuses.ts'
export { durations, type DurationsOptions } from './durations.ts'
export { timing_functions, type TimingFunctionsOptions } from './timing-functions.ts'
export type { Normalize } from './shared.ts'
export { z_indexes } from './z-indexes.ts'
export {
	specificity,
	summarize_specificity,
	type SpecificityResult,
	type SpecificitySummary,
} from './specificity.ts'
export { text_shadows } from './text-shadows.ts'
export { displays } from './displays.ts'
export { units } from './units.ts'
export { keywords } from './keywords.ts'
export { resets } from './resets.ts'
export { value_prefixes } from './value-prefixes.ts'
export { value_browserhacks } from './value-browserhacks.ts'
export { value_complexity } from './value-complexity.ts'
export { animation_names } from './animation-names.ts'
export { declarations, type DeclarationsResult } from './declarations.ts'
export { rules, type RulesResult } from './rules.ts'
export { selectors, type SelectorsResult } from './selectors.ts'
export { properties, type PropertiesResult } from './properties.ts'
export { atrules, type AtrulesResult } from './atrules.ts'
export { stylesheet, type StylesheetResult } from './stylesheet.ts'
// The types you need to write down a collector map, so there is one import for the whole signature
export type {
	CollectorDef,
	ContextCountOptions,
	ContextCountResult,
	CountOptions,
	CountResult,
	Location,
	ResultOf,
	WithContexts,
} from '../engine/types.ts'
