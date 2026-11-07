import { get_list_items } from '../adapter/css-parser.js'
import type { CollectorDef, CountOptions, CountResult } from '../engine/types.js'
import { analyze_animation } from '../values/animations.js'
import { define_counting_collector, lowercase_unless_var, type Normalize } from './shared.js'

export type TimingFunctionsOptions = CountOptions & {
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
					if (ctx.clean_value_text === undefined) return
					const at = ctx.at(ctx.value!)
					const items =
						ctx.property === 'transition' || ctx.property === 'animation'
							? analyze_animation(ctx.value!).timing_functions
							: get_list_items(ctx.value!).map((item) => item.text)
					for (const item of items) {
						counter.add(lowercase ? lowercase_unless_var(item) : item, at)
					}
				},
			},
		}
	})
}
