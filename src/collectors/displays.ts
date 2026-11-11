import type { CollectorDef, CountOptions, CountResult } from '../engine/types.ts'
import { keywords as global_keywords } from '../values/values.ts'
import { define_counting_collector, lowercase_unless_var } from './shared.ts'

const PROPERTIES = new Set(['display'])

/** Values of `display`, lowercased (values with `var()` are kept as written) */
export function displays(options: CountOptions = {}): CollectorDef<CountResult> {
	return define_counting_collector(options, function setup(counter) {
		return {
			parse: { values: true },
			declaration: {
				properties: PROPERTIES,
				enter(_node, ctx) {
					if (!ctx.value) {
						return
					}
					const raw = ctx.value_text
					const text = global_keywords.has(raw) ? raw.toLowerCase() : ctx.clean_value_text
					counter.add(lowercase_unless_var(text!), ctx.value)
				},
			},
		}
	})
}
