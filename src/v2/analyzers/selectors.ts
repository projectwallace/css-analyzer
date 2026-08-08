// Full selector analysis: specificity, complexity, ids, pseudo-classes/elements,
// attributes, custom elements, combinators, prefixed, accessibility, keyframe selectors.

import {
	NODE_TYPES,
	is_selector,
	is_selector_list,
	is_attribute_selector,
	is_type_selector,
	is_pseudo_class_selector,
	is_pseudo_element_selector,
	walk,
	SKIP,
	type AnyNode,
	type Selector,
} from '@projectwallace/css-parser'
import { calculateForAST as calculateSpecificity, compare as compareSpecificity } from '../../selectors/specificity.js'
import { getComplexity, isPrefixed, isAccessibility, getCombinators } from '../../selectors/utils.js'
import { AggregateCollection, type AggregateResult } from '../internals/aggregate-collection.js'
import { CountCollection, type CountResult, type CountResultWithLocations } from '../internals/count-collection.js'
import type { AnalyzerInstance, WalkContext } from '../core.js'

export type Specificity = [number, number, number]

export type SpecificityStats = {
	min: Specificity
	max: Specificity
	sum: Specificity
	mean: Specificity
	mode: Specificity
	items: Specificity[]
	unique: CountResult | CountResultWithLocations
}

export type SelectorsResult = {
	total: number
	totalUnique: number
	uniquenessRatio: number
	specificity: SpecificityStats
	complexity: AggregateResult & { unique: CountResult | CountResultWithLocations }
	nesting: AggregateResult & { unique: CountResult | CountResultWithLocations }
	id: (CountResult | CountResultWithLocations) & { ratio: number }
	pseudoClasses: CountResult | CountResultWithLocations
	pseudoElements: CountResult | CountResultWithLocations
	accessibility: (CountResult | CountResultWithLocations) & { ratio: number }
	attributes: CountResult | CountResultWithLocations
	customElements: CountResult | CountResultWithLocations
	keyframes: CountResult | CountResultWithLocations
	prefixed: (CountResult | CountResultWithLocations) & { ratio: number }
	combinators: CountResult | CountResultWithLocations
}

export type SelectorsOptions = { locations?: boolean }

export function selectors(options: SelectorsOptions = {}): AnalyzerInstance<SelectorsResult> {
	const withLocations = options.locations === true
	const uniqueSet = new Set<string>()
	let total = 0

	const specificityA = new AggregateCollection()
	const specificityB = new AggregateCollection()
	const specificityC = new AggregateCollection()
	const uniqueSpecificities = new CountCollection(withLocations)
	const specificityItems: Specificity[] = []
	let minSpec: Specificity | undefined
	let maxSpec: Specificity | undefined

	const complexity = new AggregateCollection()
	const uniqueComplexity = new CountCollection(withLocations)
	const nesting = new AggregateCollection()
	const uniqueNesting = new CountCollection(withLocations)

	const ids = new CountCollection(withLocations)
	const pseudoClasses = new CountCollection(withLocations)
	const pseudoElements = new CountCollection(withLocations)
	const a11y = new CountCollection(withLocations)
	const attributes = new CountCollection(withLocations)
	const customElements = new CountCollection(withLocations)
	const keyframeSelectors = new CountCollection(withLocations)
	const prefixed = new CountCollection(withLocations)
	const combinators = new CountCollection(withLocations)

	return {
		subscribes: [NODE_TYPES.SELECTOR],
		visit(node: AnyNode, ctx: WalkContext): void {
			if (!is_selector(node)) return
			const sel = node as Selector
			const loc = { line: sel.line, col: sel.column, off: sel.start, len: sel.length }

			if (ctx.inKeyframes) {
				keyframeSelectors.add(sel.text, loc.line, loc.col, loc.off, loc.len)
				return
			}

			total++
			uniqueSet.add(sel.text)

			const nestingDepth = ctx.depth > 0 ? ctx.depth - 1 : 0
			nesting.push(nestingDepth)
			uniqueNesting.add(String(nestingDepth), loc.line, loc.col, loc.off, loc.len)

			const c = getComplexity(sel)
			complexity.push(c)
			uniqueComplexity.add(String(c), loc.line, loc.col, loc.off, loc.len)

			isPrefixed(sel, (prefix) => {
				prefixed.add(prefix.toLowerCase(), loc.line, loc.col, loc.off, loc.len)
			})
			isAccessibility(sel, (a11ySel) => {
				a11y.add(a11ySel, loc.line, loc.col, loc.off, loc.len)
			})

			walk(sel, (child) => {
				if (is_attribute_selector(child)) {
					attributes.add(child.name.toLowerCase(), loc.line, loc.col, loc.off, loc.len)
				} else if (is_type_selector(child) && !child.name.startsWith('--') && child.name.includes('-')) {
					customElements.add(child.name.toLowerCase(), loc.line, loc.col, loc.off, loc.len)
				} else if (is_pseudo_class_selector(child)) {
					pseudoClasses.add(child.name.toLowerCase(), loc.line, loc.col, loc.off, loc.len)
				} else if (is_pseudo_element_selector(child)) {
					pseudoElements.add(child.name.toLowerCase(), loc.line, loc.col, loc.off, loc.len)
				}
			})

			getCombinators(sel, ({ name, loc: cLoc }) => {
				combinators.add(name, cLoc.line, cLoc.column, cLoc.offset, cLoc.length)
			})

			const spec = calculateSpecificity(sel)
			const [sa, sb, sc] = spec
			specificityA.push(sa)
			specificityB.push(sb)
			specificityC.push(sc)
			uniqueSpecificities.add(spec.toString(), loc.line, loc.col, loc.off, loc.len)
			specificityItems.push(spec)

			if (!minSpec || compareSpecificity(minSpec, spec) > 0) minSpec = spec
			if (!maxSpec || compareSpecificity(maxSpec, spec) < 0) maxSpec = spec

			if (sa > 0) ids.add(sel.text, loc.line, loc.col, loc.off, loc.len)

			return SKIP
		},
		collect(): SelectorsResult {
			const zero: Specificity = [0, 0, 0]
			const saAgg = specificityA.collect()
			const sbAgg = specificityB.collect()
			const scAgg = specificityC.collect()

			const idsResult = ids.collect()
			const a11yResult = a11y.collect()
			const prefixedResult = prefixed.collect()

			return {
				total,
				totalUnique: uniqueSet.size,
				uniquenessRatio: total === 0 ? 0 : uniqueSet.size / total,
				specificity: {
					min: minSpec ?? zero,
					max: maxSpec ?? zero,
					sum: [saAgg.sum, sbAgg.sum, scAgg.sum],
					mean: [saAgg.mean, sbAgg.mean, scAgg.mean],
					mode: [saAgg.mode, sbAgg.mode, scAgg.mode],
					items: specificityItems,
					unique: uniqueSpecificities.collect(),
				},
				complexity: { ...complexity.collect(), unique: uniqueComplexity.collect() },
				nesting: { ...nesting.collect(), unique: uniqueNesting.collect() },
				id: { ...idsResult, ratio: total === 0 ? 0 : idsResult.total / total },
				pseudoClasses: pseudoClasses.collect(),
				pseudoElements: pseudoElements.collect(),
				accessibility: { ...a11yResult, ratio: total === 0 ? 0 : a11yResult.total / total },
				attributes: attributes.collect(),
				customElements: customElements.collect(),
				keyframes: keyframeSelectors.collect(),
				prefixed: { ...prefixedResult, ratio: total === 0 ? 0 : prefixedResult.total / total },
				combinators: combinators.collect(),
			}
		},
	}
}
