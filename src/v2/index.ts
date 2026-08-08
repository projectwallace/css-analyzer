// v2 — composable CSS analyzer pipeline
// Import only the analyzers you need; the bundler tree-shakes the rest.

export { createPipeline, type AnalyzerInstance, type WalkContext } from './core.js'

// ─── Collections ────────────────────────────────────────────────────────────
export type { Location } from './internals/location-store.js'
export type { CountResult, CountResultWithLocations } from './internals/count-collection.js'
export type { NumericResult, NumericResultWithLocations } from './internals/numeric-collection.js'
export type { AggregateResult } from './internals/aggregate-collection.js'
export type { ContextCountResult, ContextCountResultWithLocations } from './internals/context-count-collection.js'

// ─── Stylesheet ──────────────────────────────────────────────────────────────
export { linesOfCode, type LinesOfCodeResult } from './analyzers/lines-of-code.js'
export { sourceLinesOfCode, type SourceLinesOfCodeResult } from './analyzers/source-lines-of-code.js'
export { stylesheetMeta, type StylesheetMetaResult } from './analyzers/stylesheet-meta.js'

// ─── Embedded content ────────────────────────────────────────────────────────
export {
	embeddedContent,
	type EmbeddedContentOptions,
	type EmbeddedContentResult,
	type EmbeddedContentResultWithLocations,
	type EmbedTypeResult,
	type EmbedTypeResultWithLocations,
} from './analyzers/embedded-content.js'

// ─── At-rules ────────────────────────────────────────────────────────────────
export { atruleImports, type AtruleImportsOptions } from './analyzers/atrule-imports.js'
export { atruleCharsets, type AtruleCharsetsOptions } from './analyzers/atrule-charsets.js'
export { atruleLayers, type AtruleLayersOptions } from './analyzers/atrule-layers.js'
export { atruleFontFaces, type AtruleFontFacesOptions, type AtruleFontFacesResult } from './analyzers/atrule-fontfaces.js'
export { atruleKeyframes, type AtruleKeyframesOptions, type AtruleKeyframesResult } from './analyzers/atrule-keyframes.js'
export { atruleMedia, type AtruleMediaOptions, type AtruleMediaResult } from './analyzers/atrule-media.js'
export { atruleSupports, type AtruleSupportsOptions, type AtruleSupportsResult } from './analyzers/atrule-supports.js'
export { atruleContainers, type AtruleContainersOptions, type AtruleContainersResult } from './analyzers/atrule-containers.js'
export { atruleMisc, type AtruleMiscOptions, type AtruleMiscResult } from './analyzers/atrule-misc.js'

// ─── Media features ──────────────────────────────────────────────────────────
export { uniqueMediaFeatures, type UniqueMediaFeaturesOptions } from './analyzers/unique-media-features.js'

// ─── Rules ───────────────────────────────────────────────────────────────────
export { rules, type RulesOptions, type RulesResult } from './analyzers/rules.js'
export { declarationsPerRule, type DeclarationsPerRuleOptions } from './analyzers/declarations-per-rule.js'

// ─── Selectors ───────────────────────────────────────────────────────────────
export {
	selectors,
	type SelectorsOptions,
	type SelectorsResult,
	type Specificity,
	type SpecificityStats,
} from './analyzers/selectors.js'

// ─── Declarations ────────────────────────────────────────────────────────────
export { declarations, type DeclarationsOptions, type DeclarationsResult } from './analyzers/declarations.js'

// ─── Properties ──────────────────────────────────────────────────────────────
export { properties, type PropertiesOptions, type PropertiesResult } from './analyzers/properties.js'

// ─── Values ──────────────────────────────────────────────────────────────────
export { uniqueColors, type UniqueColorsOptions } from './analyzers/unique-colors.js'
export { colorFormats, type ColorFormatsOptions } from './analyzers/values/color-formats.js'
export { gradients, type GradientsOptions } from './analyzers/values/gradients.js'
export { fontFamilies, type FontFamiliesOptions } from './analyzers/values/font-families.js'
export { fontSizes, type FontSizesOptions } from './analyzers/values/font-sizes.js'
export { lineHeights, type LineHeightsOptions } from './analyzers/values/line-heights.js'
export { zIndexes, type ZIndexesOptions } from './analyzers/values/z-indexes.js'
export { shadows, type ShadowsOptions, type ShadowsResult } from './analyzers/values/shadows.js'
export { borderRadii, type BorderRadiiOptions } from './analyzers/values/border-radii.js'
export { animations, type AnimationsOptions, type AnimationsResult } from './analyzers/values/animations.js'
export { units, type UnitsOptions } from './analyzers/values/units.js'
export { keywords, type KeywordsOptions } from './analyzers/values/keywords.js'
export { resets, type ResetsOptions } from './analyzers/values/resets.js'
export { displays, type DisplaysOptions } from './analyzers/values/displays.js'
export { vendorPrefixedValues, type VendorPrefixedValuesOptions } from './analyzers/values/vendor-prefixed-values.js'
export { valueBrowserhacks, type ValueBrowserhacksOptions } from './analyzers/values/value-browserhacks.js'
