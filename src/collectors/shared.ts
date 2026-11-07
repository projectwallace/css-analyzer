import { get_list_items, get_name, get_value_kind } from '../adapter/css-parser.js'
import { analyze_animation } from '../values/animations.js'
import { keywords } from '../values/values.js'
import { unquote } from '../string-utils.js'
import { create_counter, merge_counts } from '../engine/counter.js'
import { define_collector } from '../engine/define-collector.js'
import type { Counter } from '../engine/counter.js'
import type {
	CollectorDef,
	CollectorInstance,
	CountOptions,
	CountResult,
	DeclarationContext,
} from '../engine/types.js'

export type Normalize = 'lowercase' | 'none'

/** Properties whose values are never searched for colors, gradients, ... (names, timing, numbers) */
export const NO_VALUE_WALK: ReadonlySet<string> = new Set([
	'font-family',
	'transition',
	'animation',
	'z-index',
])

/** Lowercase, except for values with var(): their fallbacks can hold case-sensitive names */
export function lowercase_unless_var(text: string): string {
	const lower = text.toLowerCase()
	return lower.includes('var(') ? text : lower
}

/**
 * Most collectors just count strings: this wires a counter to a handler set
 * and returns the standard count result.
 */
export function define_counting_collector(
	options: CountOptions,
	setup: (counter: Counter) => Omit<CollectorInstance<CountResult>, 'result'>,
): CollectorDef<CountResult> {
	return define_collector<CountResult>(function init() {
		const counter = create_counter(options)
		return { ...setup(counter), result: () => counter.result() }
	}, merge_counts)
}

/** Animation names of an `animation` or `animation-name` declaration (quotes removed) */
export function get_animation_names(ctx: DeclarationContext): string[] {
	if (ctx.clean_value_text === undefined) return []
	if (ctx.property === 'animation') {
		return analyze_animation(ctx.value!).names.map((name) => unquote(name))
	}
	if (ctx.property !== 'animation-name') return []

	const names: string[] = []
	for (const item of get_list_items(ctx.value!)) {
		const kind = get_value_kind(item)
		if (kind === 'identifier' && !keywords.has(get_name(item))) {
			names.push(item.text)
		} else if (kind === 'string') {
			names.push(unquote(item.text))
		}
	}
	return names
}

/** Options for counters that only need counts (sequences are for numeric series) */
export function without_sequence(options: CountOptions): CountOptions {
	return { locations: options.locations }
}

/** The property to count under, following the `property` option of context collectors */
export function get_context_property(
	ctx: DeclarationContext,
	mode: 'normalized' | 'as_written' | undefined,
): string {
	return mode === 'as_written' ? ctx.raw_property : ctx.property
}
