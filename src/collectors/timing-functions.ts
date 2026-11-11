import type { CollectorDef, CountOptions, CountResult } from '../engine/types.ts'
import { analyze_animation } from '../values/animations.ts'
import { define_counting_collector, type Normalize } from './shared.ts'
import { get_list_items, lowercase_unless_var } from './value-helpers.ts'

export type TimingFunctionsOptions = CountOptions & {
	/** `lowercase` (default) lowercases the values (`EASE` is `ease`; values with `var()` are kept). `none` keeps them as written. */
	normalize?: Normalize
}

const PROPERTIES = new Set([
	'transition',
	'animation',
	'transition-timing-function',
	'animation-timing-function',
])

/** Keywords and functions (`ease-in`, `cubic-bezier()`, `steps()`) of transitions and animations */
export function timing_functions(options: TimingFunctionsOptions = {}): CollectorDef<CountResult> {
	const lowercase = options.normalize !== 'none'

	return define_counting_collector(options, function setup(counter) {
		return {
			parse: { values: true },
			declaration: {
				properties: PROPERTIES,
				enter(_node, ctx) {
					if (ctx.clean_value_text === undefined) {
						return
					}
					const items =
						ctx.property === 'transition' || ctx.property === 'animation'
							? analyze_animation(ctx.value!).timing_functions
							: get_list_items(ctx.value!).map((item) => item.text)
					for (const item of items) {
						counter.add(lowercase ? lowercase_unless_var(item) : item, ctx.value!)
					}
				},
			},
		}
	})
}
