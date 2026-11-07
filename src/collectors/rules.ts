import { get_rule_parts } from '../adapter/css-parser.js'
import { create_counter, merge_counts } from '../engine/counter.js'
import { define_collector } from '../engine/define-collector.js'
import type { CollectorDef, CountOptions, CountResult } from '../engine/types.js'

export type RulesResult = {
	total: number
	empty: number
	/** Selectors + declarations per rule. Items are numbers. */
	sizes: CountResult
	nesting: CountResult
	selectors: CountResult
	declarations: CountResult
}

/** Rules (keyframe steps are not rules): how many, how big, how nested. */
export function rules(options: CountOptions = {}): CollectorDef<RulesResult> {
	return define_collector<RulesResult>(
		function init() {
			const sizes = create_counter(options)
			const nesting = create_counter(options)
			const selectors = create_counter(options)
			const declarations = create_counter(options)
			let total = 0
			let empty = 0

			return {
				parse: { selectors: true },
				rule(node, ctx) {
					if (ctx.in_keyframes) return
					total++
					const parts = get_rule_parts(node)
					if (parts.is_empty) empty++
					sizes.add(String(parts.selectors.length + parts.declarations), ctx)
					nesting.add(String(ctx.depth), ctx)
					selectors.add(String(parts.selectors.length), ctx)
					declarations.add(String(parts.declarations), ctx)
				},
				result: () => ({
					total,
					empty,
					sizes: sizes.result(),
					nesting: nesting.result(),
					selectors: selectors.result(),
					declarations: declarations.result(),
				}),
			}
		},
		(a, b) => ({
			total: a.total + b.total,
			empty: a.empty + b.empty,
			sizes: merge_counts(a.sizes, b.sizes),
			nesting: merge_counts(a.nesting, b.nesting),
			selectors: merge_counts(a.selectors, b.selectors),
			declarations: merge_counts(a.declarations, b.declarations),
		}),
	)
}
