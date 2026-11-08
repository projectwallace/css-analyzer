import type { CollectorDef, CountOptions, CountResult } from '../engine/types.ts'
import { analyze_animation } from '../values/animations.ts'
import {
	define_counting_collector,
	get_list_items,
	lowercase_unless_var,
	type Normalize,
} from './shared.ts'

export type DurationsOptions = CountOptions & {
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
