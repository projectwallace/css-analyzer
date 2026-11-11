import { IDENTIFIER } from '@projectwallace/css-parser'
import type { CollectorDef, CountOptions, CountResult } from '../engine/types.ts'
import { analyze_animation } from '../values/animations.ts'
import { keywords as global_keywords } from '../values/values.ts'
import { define_counting_collector } from './shared.ts'
import { NO_VALUE_WALK } from './value-helpers.ts'

/** Global keywords (`inherit`, `none`, `auto`, ...) used as values, lowercased */
export function keywords(options: CountOptions = {}): CollectorDef<CountResult> {
	return define_counting_collector(options, function setup(counter) {
		return {
			parse: { values: true },
			declaration: {
				enter(_node, ctx) {
					if (!ctx.value) {
						return
					}
					const text = ctx.value_text

					if (global_keywords.has(text)) {
						counter.add(text.toLowerCase(), ctx.value)
					} else if (ctx.property === 'font') {
						for (const keyword of ctx.font_shorthand?.keywords ?? []) {
							counter.add(keyword.toLowerCase(), ctx.value)
						}
					} else if (ctx.property === 'transition' || ctx.property === 'animation') {
						for (const keyword of analyze_animation(ctx.value).keywords) {
							counter.add(keyword.toLowerCase(), ctx.value)
						}
					}
				},
			},
			value: {
				types: [IDENTIFIER],
				enter(node, ctx) {
					// Whole-value keywords and shorthands were handled above
					if (NO_VALUE_WALK.has(ctx.property) || ctx.property === 'font') {
						return
					}
					if (global_keywords.has(ctx.value_text)) {
						return
					}
					const text = node.text
					if (global_keywords.has(text)) {
						counter.add(text.toLowerCase(), node)
					}
				},
			},
		}
	})
}
