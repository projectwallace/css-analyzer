import { create_counter } from '../engine/counter.ts'
import { get_declaration_weight } from './complexity.ts'
import { without_sequence } from './shared.ts'
import { define_collector } from '../engine/define-collector.ts'
import type { CollectorDef, CountOptions, CountResult } from '../engine/types.ts'

export type DeclarationsResult = CountResult & {
	/** `!important` declarations: how many, and how many of those are inside `@keyframes` (where they are ignored) */
	importants: { total: number; in_keyframes: number }
	/** 1, plus 1 for `!important`, plus 1 more inside keyframes. Items are numbers. */
	complexity: CountResult<number>
	/** How deep the declaration is nested. Items are numbers. */
	nesting: CountResult<number>
}

/**
 * Every declaration (counted by its text), `!important` usage, complexity and nesting.
 * Use `summarize_numbers()` on `complexity` and `nesting` for min, max, mean, ...
 */
export function declarations(options: CountOptions = {}): CollectorDef<DeclarationsResult> {
	return define_collector<DeclarationsResult>(function init() {
		const texts = create_counter(without_sequence(options))
		const complexity = create_counter<number>(without_sequence(options))
		const nesting = create_counter<number>(options)
		let importants = 0
		let importants_in_keyframes = 0

		return {
			declaration: {
				enter(node, ctx) {
					texts.add(node.text, node)
					nesting.add(Math.max(ctx.depth - 1, 0), node)

					if (ctx.is_important) {
						importants++
						if (ctx.atrule_stack.includes('keyframes')) {
							importants_in_keyframes++
						}
					}
					complexity.add(get_declaration_weight(ctx), node)
				},
			},
			result: () => ({
				...texts.result(),
				importants: { total: importants, in_keyframes: importants_in_keyframes },
				complexity: complexity.result(),
				nesting: nesting.result(),
			}),
		}
	})
}
