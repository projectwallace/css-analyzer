import { is_declaration, is_selector, is_selector_list } from '@projectwallace/css-parser'
import { create_counter } from '../engine/counter.ts'
import { define_collector } from '../engine/define-collector.ts'
import type { CollectorDef, CountOptions, CountResult } from '../engine/types.ts'

export type RulesResult = {
	/** Number of style rules */
	total: number
	/** Rules with an empty block (`a {}`) */
	empty: number
	/** Selectors + declarations per rule. Items are numbers. */
	sizes: CountResult<number>
	/** How deep each rule is nested (0 for a top-level rule). Items are numbers. */
	nesting: CountResult<number>
	/** Number of selectors per rule. Items are numbers. */
	selectors: CountResult<number>
	/** Number of declarations per rule. Items are numbers. */
	declarations: CountResult<number>
}

/**
 * Rules (keyframe steps are not rules): how many, how big, how nested.
 * Pass `{ sequence: true }` to also get the numbers in source order (for charts).
 */
export function rules(options: CountOptions = {}): CollectorDef<RulesResult> {
	return define_collector<RulesResult>(function init() {
		const sizes = create_counter<number>(options)
		const nesting = create_counter<number>(options)
		const selectors = create_counter<number>(options)
		const declarations = create_counter<number>(options)
		let total = 0
		let empty = 0

		return {
			parse: { selectors: true },
			rule(node, ctx) {
				if (ctx.atrule_stack.includes('keyframes')) {
					return
				}
				total++
				const block = node.block
				if (block?.is_empty) {
					empty++
				}

				// Selectors are only found when selectors are parsed
				let selector_count = 0
				const prelude = node.prelude
				if (prelude && is_selector_list(prelude)) {
					prelude.for_each(function (selector) {
						if (is_selector(selector)) {
							selector_count++
						}
					})
				}
				let declaration_count = 0
				block?.for_each(function (child) {
					if (is_declaration(child)) {
						declaration_count++
					}
				})

				sizes.add(selector_count + declaration_count, node)
				nesting.add(ctx.depth, node)
				selectors.add(selector_count, node)
				declarations.add(declaration_count, node)
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
	})
}
