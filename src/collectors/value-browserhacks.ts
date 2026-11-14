import { str_index_of } from '@projectwallace/css-parser'
import type { CollectorDef, CountOptions, CountResult } from '../engine/types.ts'
import { get_value_browserhacks } from '../values/browserhacks.ts'
import { define_counting_collector } from './shared.ts'

/** Value browserhacks: `progid:`, `\9`, `\7`, `alpha()`, `expression()`, `.htc` and `!ie` */
export function value_browserhacks(options: CountOptions = {}): CollectorDef<CountResult> {
	return define_counting_collector(options, function setup(counter) {
		return {
			parse: { values: true },
			declaration: {
				enter(node, ctx) {
					if (!ctx.value) {
						return
					}
					if (ctx.is_important && str_index_of('!important', node.text) === -1) {
						counter.add('!ie', ctx.value)
					}
					if (ctx.clean_value_text === undefined || ctx.is_custom) {
						return
					}
					for (const hack of get_value_browserhacks(ctx.value)) {
						counter.add(hack, ctx.value)
					}
				},
			},
		}
	})
}
