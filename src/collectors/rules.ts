import { is_declaration, is_selector, is_selector_list } from '@projectwallace/css-parser'
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

/**
 * Rules (keyframe steps are not rules): how many, how big, how nested.
 * Pass `{ sequence: true }` to also get the numbers in source order (for charts).
 */
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
					if (node.block?.is_empty) empty++

					// Selectors are only found when selectors are parsed
					let selector_count = 0
					if (node.has_prelude && is_selector_list(node.prelude)) {
						for (const selector of node.prelude) {
							if (is_selector(selector)) selector_count++
						}
					}
					let declaration_count = 0
					for (const child of node.block ?? []) {
						if (is_declaration(child)) declaration_count++
					}

					sizes.add(String(selector_count + declaration_count), ctx)
					nesting.add(String(ctx.depth), ctx)
					selectors.add(String(selector_count), ctx)
					declarations.add(String(declaration_count), ctx)
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
