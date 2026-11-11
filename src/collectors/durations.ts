import type { CollectorDef, CountOptions, CountResult } from '../engine/types.ts'
import { analyze_animation } from '../values/animations.ts'
import { define_counting_collector, type Normalize } from './shared.ts'
import { get_list_items, lowercase_unless_var } from './value-helpers.ts'

export type DurationsOptions = CountOptions & {
	/** `lowercase` (default) lowercases the values (`1S` is `1s`; values with `var()` are kept). `none` keeps them as written. */
	normalize?: Normalize
}

const PROPERTIES = new Set(['transition', 'animation', 'transition-duration', 'animation-duration'])

/** Durations of `transition` and `animation` (and their `-duration` longhands). Delays are not counted. */
export function durations(options: DurationsOptions = {}): CollectorDef<CountResult> {
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
							? analyze_animation(ctx.value!).durations
							: get_list_items(ctx.value!).map((item) => item.text)
					for (const item of items) {
						counter.add(lowercase ? lowercase_unless_var(item) : item, ctx.value!)
					}
				},
			},
		}
	})
}
