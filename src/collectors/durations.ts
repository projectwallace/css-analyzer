import type { CollectorDef, CountOptions, CountResult } from '../engine/types.ts'
import { durations_of, duration_properties } from '../extract/animations.ts'
import { define_counting_collector, type Normalize } from './shared.ts'
import { lowercase_unless_var } from '../extract/shared.ts'

export type DurationsOptions = CountOptions & {
	/** `none` keeps the case as written */
	normalize?: Normalize
}

/** Durations of `transition` and `animation`; delays are not counted */
export function durations(options: DurationsOptions = {}): CollectorDef<CountResult> {
	const lowercase = options.normalize !== 'none'

	return define_counting_collector(options, function setup(counter) {
		return {
			parse: { values: true },
			declaration: {
				properties: duration_properties.set,
				enter(_node, ctx) {
					const value = ctx.value
					if (!value) {
						return
					}
					for (const { value: item } of durations_of(ctx.property, value)) {
						counter.add(lowercase ? lowercase_unless_var(item) : item, value)
					}
				},
			},
		}
	})
}
