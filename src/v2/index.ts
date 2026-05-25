export { createPipeline, type AnalyzerInstance } from './core.js'
export { uniqueColors, type UniqueColorsOptions } from './analyzers/unique-colors.js'
export {
	declarationsPerRule,
	type DeclarationsPerRuleOptions,
} from './analyzers/declarations-per-rule.js'
export { linesOfCode, type LinesOfCodeResult } from './analyzers/lines-of-code.js'
export {
	uniqueMediaFeatures,
	type UniqueMediaFeaturesOptions,
} from './analyzers/unique-media-features.js'
export {
	embeddedContent,
	type EmbeddedContentOptions,
	type EmbeddedContentResult,
	type EmbeddedContentResultWithLocations,
	type EmbedTypeResult,
	type EmbedTypeResultWithLocations,
} from './analyzers/embedded-content.js'
export type { Location } from './internals/location-store.js'
export type { CountResult, CountResultWithLocations } from './internals/count-collection.js'
export type { NumericResult, NumericResultWithLocations } from './internals/numeric-collection.js'
