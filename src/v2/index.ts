export { createPipeline, type AnalyzerInstance } from './core.js'
export { uniqueColors, type UniqueColorsOptions } from './analyzers/unique-colors.js'
export {
	declarationsPerRule,
	type DeclarationsPerRuleOptions,
} from './analyzers/declarations-per-rule.js'
export type { Location } from './internals/location-store.js'
export type { CountResult, CountResultWithLocations } from './internals/count-collection.js'
export type { NumericResult, NumericResultWithLocations } from './internals/numeric-collection.js'
