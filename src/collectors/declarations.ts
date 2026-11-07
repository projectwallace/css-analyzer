import { create_counter, merge_counts } from '../engine/counter.js'
import { without_sequence } from './shared.js'
import { define_collector } from '../engine/define-collector.js'
import type { CollectorDef, CountOptions, CountResult } from '../engine/types.js'

export type DeclarationsResult = CountResult & {
	importants: { total: number; in_keyframes: number }
	/** 1, plus 1 for `!important`, plus 1 more inside keyframes. Items are numbers. */
	complexity: CountResult
	/** How deep the declaration is nested. Items are numbers. */
	nesting: CountResult
}

/**
 * Every declaration (counted by its text), `!important` usage, complexity and nesting.
 * Use `summarize_numbers()` on `complexity` and `nesting` for min, max, mean, ...
 */
export function declarations(options: CountOptions = {}): CollectorDef<DeclarationsResult> {
	return define_collector<DeclarationsResult>(
		function init() {
			const texts = create_counter(without_sequence(options))
			const complexity = create_counter(without_sequence(options))
			const nesting = create_counter(options)
			let importants = 0
			let importants_in_keyframes = 0

			return {
				declaration(node, ctx) {
					texts.add(node.text, ctx)
					nesting.add(String(Math.max(ctx.depth - 1, 0)), ctx)

					let weight = 1
					if (ctx.is_important) {
						importants++
						weight++
						if (ctx.in_keyframes) {
							importants_in_keyframes++
							weight++
						}
					}
					complexity.add(String(weight), ctx)
				},
				result: () => ({
					...texts.result(),
					importants: { total: importants, in_keyframes: importants_in_keyframes },
					complexity: complexity.result(),
					nesting: nesting.result(),
				}),
			}
		},
		(a, b) => ({
			...merge_counts(a, b),
			importants: {
				total: a.importants.total + b.importants.total,
				in_keyframes: a.importants.in_keyframes + b.importants.in_keyframes,
			},
			complexity: merge_counts(a.complexity, b.complexity),
			nesting: merge_counts(a.nesting, b.nesting),
		}),
	)
}
