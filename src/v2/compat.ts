// Compatibility layer: runs the v2 pipeline and reassembles the v9 analyze() output shape.
// Drop-in replacement for `import { analyze } from './index.js'` in tests.

import { createPipeline } from './core.js'
import { linesOfCode } from './analyzers/lines-of-code.js'
import { sourceLinesOfCode } from './analyzers/source-lines-of-code.js'
import { stylesheetMeta } from './analyzers/stylesheet-meta.js'
import { embeddedContent } from './analyzers/embedded-content.js'
import { atruleAll } from './analyzers/atrule-all.js'
import { atruleImports } from './analyzers/atrule-imports.js'
import { atruleCharsets } from './analyzers/atrule-charsets.js'
import { atruleLayers } from './analyzers/atrule-layers.js'
import { atruleFontFaces } from './analyzers/atrule-fontfaces.js'
import { atruleKeyframes } from './analyzers/atrule-keyframes.js'
import { atruleMedia } from './analyzers/atrule-media.js'
import { atruleSupports } from './analyzers/atrule-supports.js'
import { atruleContainers } from './analyzers/atrule-containers.js'
import { atruleMisc } from './analyzers/atrule-misc.js'
import { uniqueMediaFeatures } from './analyzers/unique-media-features.js'
import { rules } from './analyzers/rules.js'
import { declarationsPerRule } from './analyzers/declarations-per-rule.js'
import { selectors } from './analyzers/selectors.js'
import { declarations } from './analyzers/declarations.js'
import { properties } from './analyzers/properties.js'
import { colorsContext } from './analyzers/colors-context.js'
import { gradients } from './analyzers/values/gradients.js'
import { fontFamilies } from './analyzers/values/font-families.js'
import { fontSizes } from './analyzers/values/font-sizes.js'
import { lineHeights } from './analyzers/values/line-heights.js'
import { zIndexes } from './analyzers/values/z-indexes.js'
import { shadows } from './analyzers/values/shadows.js'
import { borderRadii } from './analyzers/values/border-radii.js'
import { animations } from './analyzers/values/animations.js'
import { units } from './analyzers/values/units.js'
import { keywords } from './analyzers/values/keywords.js'
import { resets } from './analyzers/values/resets.js'
import { displays } from './analyzers/values/displays.js'
import { vendorPrefixedValues } from './analyzers/values/vendor-prefixed-values.js'
import { valueBrowserhacks } from './analyzers/values/value-browserhacks.js'
import { valueComplexity } from './analyzers/value-complexity.js'
import type { CountResult } from './internals/count-collection.js'
import type { AggregateResult } from './internals/aggregate-collection.js'

// Re-export all pure utility functions so callers can import from compat.ts directly.
export { compare as compareSpecificity, calculate as calculateSpecificity } from '../selectors/specificity.js'
export {
	getComplexity as selectorComplexity,
	isPrefixed as isSelectorPrefixed,
	isAccessibility as isAccessibilitySelector,
} from '../selectors/utils.js'
export { isSupportsBrowserhack, isMediaBrowserhack } from '../atrules/atrules.js'
export { isHack as isPropertyHack } from '../properties/property-utils.js'
export { isValuePrefixed } from '../values/vendor-prefix.js'
export { isValueBrowserhack } from '../values/browserhacks.js'
export { colorFunctions, colorKeywords, namedColors, systemColors } from '../values/colors.js'
export { keywords as cssKeywords } from '../values/values.js'
export { hasVendorPrefix } from '../vendor-prefix.js'
export { KeywordSet } from '../keyword-set.js'
export type { UniqueWithLocations, Location } from '../collection.js'
export type { Specificity } from './analyzers/selectors.js'

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Compute stats + unique-count map from a raw items array.
// Mirrors v9: assign(agg.aggregate(), { items }, collection.c())
function statsFromItems(items: number[]) {
	const len = items.length
	if (len === 0) {
		return { min: 0, max: 0, mean: 0, mode: 0, range: 0, sum: 0, items: [], total: 0, totalUnique: 0, unique: {}, uniquenessRatio: 0 }
	}
	const sorted = items.slice().sort((a, b) => a - b)
	const min = sorted[0]!
	const max = sorted[len - 1]!
	const sum = items.reduce((a, b) => a + b, 0)

	const freq = new Map<number, number>()
	let maxF = -1, modeSum = 0, modeCount = 0
	for (const v of sorted) {
		const f = (freq.get(v) ?? 0) + 1
		freq.set(v, f)
		if (f > maxF) { maxF = f; modeSum = 0; modeCount = 0 }
		if (f >= maxF) { modeCount++; modeSum += v }
	}

	const unique: Record<string, number> = {}
	for (const [v, c] of freq) unique[String(v)] = c

	return {
		min, max, mean: sum / len, mode: modeSum / modeCount,
		range: max - min, sum, items,
		total: len, totalUnique: freq.size, unique, uniquenessRatio: freq.size / len,
	}
}

// v9 shape: assign(agg.aggregate(), { items }, collection.c())
// Flattens AggregateResult + CountResult into a single object.
function flatAggColl(agg: AggregateResult, coll: CountResult) {
	const { min, max, mean, mode, range, sum, items } = agg
	const { total, totalUnique, unique, uniquenessRatio } = coll
	return { min, max, mean, mode, range, sum, items, total, totalUnique, unique, uniquenessRatio }
}

// Strip to just the 6 stat fields — used for complexity objects in v9 that have no items/total.
function onlyStats({ min, max, mean, mode, range, sum }: AggregateResult) {
	return { min, max, mean, mode, range, sum }
}

// ─── Pipeline factory ────────────────────────────────────────────────────────
// Fresh analyzer instances are created per call so state never leaks between runs.

function makePipeline() {
	return createPipeline({
	loc: linesOfCode(),
	sloc: sourceLinesOfCode(),
	meta: stylesheetMeta(),
	embed: embeddedContent(),
	atruleAll: atruleAll(),
	atruleImports: atruleImports(),
	atruleCharsets: atruleCharsets(),
	atruleLayers: atruleLayers(),
	atruleFontFaces: atruleFontFaces(),
	atruleKeyframes: atruleKeyframes(),
	atruleMedia: atruleMedia(),
	atruleSupports: atruleSupports(),
	atruleContainers: atruleContainers(),
	atruleMisc: atruleMisc(),
	mediaFeatures: uniqueMediaFeatures(),
	rules: rules(),
	declsPerRule: declarationsPerRule(),
	sel: selectors(),
	decls: declarations(),
	props: properties(),
	colors: colorsContext(),
	grads: gradients(),
	fontFamilies: fontFamilies(),
	fontSizes: fontSizes(),
	lineHeights: lineHeights(),
	zIndexes: zIndexes(),
	shadows: shadows(),
	borderRadii: borderRadii(),
	animations: animations(),
	units: units(),
	keywords: keywords(),
	resets: resets(),
	displays: displays(),
	vpValues: vendorPrefixedValues(),
	vbHacks: valueBrowserhacks(),
	valueC: valueComplexity(),
})
}

export type Options = { useLocations?: boolean }

export function analyze(css: string, _options: Options = {}) {
	const start = Date.now()
	const r = makePipeline().run(css)
	const analyzeStart = start // parse happens inside pipeline.run; we can't split it cleanly
	const end = Date.now()

	const atruleAllResult = r.atruleAll as CountResult
	const kf = r.atruleKeyframes
	const ruleDecls = statsFromItems((r.declsPerRule as { items: number[] }).items)

	const atComplexity = r.atruleMisc.complexity
	const selComplexity = r.sel.complexity
	const declComplexity = r.decls.complexity
	const propComplexity = r.props.complexity
	const valComplexity = r.valueC

	return {
		stylesheet: {
			sourceLinesOfCode: r.sloc.total,
			linesOfCode: r.loc.total,
			size: r.meta.size,
			complexity:
				atComplexity.sum +
				selComplexity.sum +
				declComplexity.sum +
				propComplexity.sum +
				valComplexity.sum,
			comments: r.meta.comments,
			embeddedContent: {
				size: {
					total: r.embed.totalSize,
					ratio: r.embed.sizeRatio,
				},
				types: {
					total: r.embed.totalCount,
					totalUnique: Object.keys(r.embed.unique).length,
					uniquenessRatio:
						r.embed.totalCount === 0
							? 0
							: Object.keys(r.embed.unique).length / r.embed.totalCount,
					unique: r.embed.unique,
				},
			},
		},

		atrules: {
			...atruleAllResult,
			fontface: {
				total: r.atruleFontFaces.total,
				totalUnique: r.atruleFontFaces.total,
				unique: r.atruleFontFaces.unique,
				uniquenessRatio: r.atruleFontFaces.total === 0 ? 0 : 1,
			},
			import: r.atruleImports,
			media: {
				...(r.atruleMedia.queries as CountResult),
				browserhacks: r.atruleMedia.browserhacks,
				features: r.mediaFeatures,
			},
			charset: r.atruleCharsets,
			supports: {
				...(r.atruleSupports.queries as CountResult),
				browserhacks: r.atruleSupports.browserhacks,
			},
			keyframes: {
				total: (kf as CountResult).total,
				totalUnique: (kf as CountResult).totalUnique,
				unique: (kf as CountResult).unique,
				uniquenessRatio: (kf as CountResult).uniquenessRatio,
				prefixed: {
					...(kf.prefixed as CountResult),
					ratio: kf.prefixedRatio,
				},
			},
			container: {
				...(r.atruleContainers.queries as CountResult),
				names: r.atruleContainers.names,
			},
			layer: r.atruleLayers,
			property: r.atruleMisc.registeredProperties,
			function: r.atruleMisc.functions,
			scope: r.atruleMisc.scopes,
			complexity: onlyStats(atComplexity),
			nesting: statsFromItems(r.atruleMisc.nesting.items),
		},

		rules: {
			total: r.rules.total,
			empty: r.rules.empty,
			sizes: flatAggColl(r.rules.sizes, r.rules.sizes.unique as CountResult),
			nesting: flatAggColl(r.rules.nesting, r.rules.nesting.unique as CountResult),
			selectors: flatAggColl(r.rules.selectorsPerRule, r.rules.selectorsPerRule.unique as CountResult),
			declarations: ruleDecls,
		},

		selectors: {
			total: r.sel.total,
			totalUnique: r.sel.totalUnique,
			uniquenessRatio: r.sel.uniquenessRatio,
			specificity: {
				...r.sel.specificity,
				...(r.sel.specificity.unique as CountResult),
				unique: (r.sel.specificity.unique as CountResult).unique,
			},
			complexity: {
				...onlyStats(selComplexity),
				items: selComplexity.items,
				...(selComplexity.unique as CountResult),
				unique: (selComplexity.unique as CountResult).unique,
			},
			nesting: flatAggColl(r.sel.nesting, r.sel.nesting.unique as CountResult),
			id: r.sel.id,
			pseudoClasses: r.sel.pseudoClasses,
			pseudoElements: r.sel.pseudoElements,
			accessibility: r.sel.accessibility,
			attributes: r.sel.attributes,
			customElements: r.sel.customElements,
			keyframes: r.sel.keyframes,
			prefixed: r.sel.prefixed,
			combinators: r.sel.combinators,
		},

		declarations: {
			total: r.decls.total,
			totalUnique: r.decls.totalUnique,
			uniquenessRatio: r.decls.uniquenessRatio,
			importants: r.decls.importants,
			complexity: onlyStats(declComplexity),
			nesting: flatAggColl(r.decls.nesting, r.decls.nesting.unique as CountResult),
		},

		properties: {
			...(r.props as unknown as CountResult),
			prefixed: r.props.prefixed,
			custom: r.props.custom,
			shorthands: r.props.shorthands,
			browserhacks: r.props.browserhacks,
			complexity: onlyStats(propComplexity),
		},

		values: {
			colors: r.colors,
			gradients: r.grads,
			fontFamilies: r.fontFamilies,
			fontSizes: r.fontSizes,
			lineHeights: r.lineHeights,
			zindexes: r.zIndexes,
			textShadows: r.shadows.textShadows,
			boxShadows: r.shadows.boxShadows,
			borderRadiuses: r.borderRadii,
			animations: r.animations,
			prefixes: r.vpValues,
			browserhacks: r.vbHacks,
			units: r.units,
			complexity: onlyStats(valComplexity),
			keywords: r.keywords,
			resets: r.resets,
			displays: r.displays,
		},

		__meta__: {
			parseTime: end - analyzeStart,
			analyzeTime: end - analyzeStart,
			total: end - start,
		},
	}
}
