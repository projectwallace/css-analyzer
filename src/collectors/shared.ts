import {
	type CSSNode,
	type Value,
	is_identifier,
	is_operator,
	is_string,
} from '@projectwallace/css-parser'
import { analyze_animation } from '../values/animations.js'
import { keywords } from '../values/values.js'
import { unquote } from '../string-utils.js'
import { create_counter } from '../engine/counter.js'
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
	})
}

/** Animation names of an `animation` or `animation-name` declaration (quotes removed) */
export function get_animation_names(ctx: DeclarationContext): string[] {
	if (ctx.clean_value_text === undefined) {
		return []
	}
	if (ctx.property === 'animation') {
		return analyze_animation(ctx.value!).names.map((name) => unquote(name))
	}
	if (ctx.property !== 'animation-name') {
		return []
	}

	const names: string[] = []
	for (const item of get_list_items(ctx.value!)) {
		if (is_identifier(item) && !keywords.has(item.name)) {
			names.push(item.text)
		} else if (is_string(item)) {
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

/** The items of a comma/slash separated value, without the separators */
export function get_list_items(value: Value): CSSNode[] {
	return Array.from(value).filter((child) => !is_operator(child))
}

/** Text of the first child when that child is an identifier (e.g. `--x` in `var(--x)`) */
export function get_first_identifier(node: CSSNode): string | undefined {
	const first = node.first_child
	return first && is_identifier(first) ? first.text : undefined
}
