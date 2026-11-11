import type { CollectorDef, CountOptions, CountResult } from '../engine/types.ts'
import { get_prefixed_values } from '../values/vendor-prefix.ts'
import { define_counting_collector } from './shared.ts'

/** Vendor prefixed values (`-webkit-box`, `-webkit-linear-gradient()`), lowercased */
export function value_prefixes(options: CountOptions = {}): CollectorDef<CountResult> {
	return define_counting_collector(options, function setup(counter) {
		return {
			parse: { values: true },
			declaration: {
				enter(_node, ctx) {
					if (ctx.clean_value_text === undefined) {
						return
					}
					for (const prefixed of get_prefixed_values(ctx.value!)) {
						counter.add(prefixed.toLowerCase(), ctx.value!)
					}
				},
			},
		}
	})
}
