import type { CollectorDef, CountOptions, CountResult } from '../engine/types.ts'
import { keywords as global_keywords } from '../values/values.ts'
import { define_counting_collector } from './shared.ts'
import { lowercase_unless_var } from './value-helpers.ts'

const properties = new Set(['display'])

/** Values of `display`, lowercased (values with `var()` are kept as written) */
export function displays(options: CountOptions = {}): CollectorDef<CountResult> {
	return define_counting_collector(options, function setup(counter) {
		return {
			parse: { values: true },
			declaration: {
				properties,
				enter(_node, ctx) {
					const raw = ctx.value_text
					// `display: ` has no value to count
					if (!ctx.value || raw === '') {
						return
					}
					const text = global_keywords.has(raw) ? raw : ctx.clean_value_text
					counter.add(lowercase_unless_var(text!), ctx.value)
				},
			},
		}
	})
}
