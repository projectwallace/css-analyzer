import type { CollectorDef, CountOptions, CountResult } from '../engine/types.ts'
import { timing_functions_of, timing_function_properties } from '../extract/animations.ts'
import { define_counting_collector, type Normalize } from './shared.ts'
import { lowercase_unless_var } from '../extract/shared.ts'

export type TimingFunctionsOptions = CountOptions & {
	/** `lowercase` (default) lowercases the values (`EASE` is `ease`; values with `var()` are kept). `none` keeps them as written. */
	normalize?: Normalize
}

/** Keywords and functions (`ease-in`, `cubic-bezier()`, `steps()`) of transitions and animations */
export function timing_functions(options: TimingFunctionsOptions = {}): CollectorDef<CountResult> {
	const lowercase = options.normalize !== 'none'

	return define_counting_collector(options, function setup(counter) {
		return {
			parse: { values: true },
			declaration: {
				properties: timing_function_properties.set,
				enter(_node, ctx) {
					const value = ctx.value
					if (!value) {
						return
					}
					for (const { value: item } of timing_functions_of(ctx.property, value)) {
						counter.add(lowercase ? lowercase_unless_var(item) : item, value)
					}
				},
			},
		}
	})
}
