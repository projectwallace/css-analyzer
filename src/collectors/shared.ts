import {
	type CSSNode,
	type Value,
	is_identifier,
	is_operator,
	is_string,
	str_index_of,
} from '@projectwallace/css-parser'
import { analyze_animation } from '../values/animations.ts'
import { keywords } from '../values/values.ts'
import { unquote } from '../string-utils.ts'
import { create_counter } from '../engine/counter.ts'
import { define_collector } from '../engine/define-collector.ts'
import type { Counter } from '../engine/counter.ts'
import type {
	CollectorDef,
	CollectorInstance,
	CountOptions,
	CountItem,
	CountResult,
	DeclarationContext,
} from '../engine/types.ts'

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
	return str_index_of('var(', text) === -1 ? text.toLowerCase() : text
}

/**
 * Most collectors just count strings: this wires a counter to a handler set
 * and returns the standard count result.
 */
export function define_counting_collector<T extends CountItem = string>(
	options: CountOptions,
	setup: (counter: Counter<T>) => Omit<CollectorInstance<CountResult<T>>, 'result'>,
): CollectorDef<CountResult<T>> {
	return define_collector<CountResult<T>>(function init() {
		const counter = create_counter<T>(options)
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
	const items: CSSNode[] = []
	value.for_each(function (child) {
		if (!is_operator(child)) {
			items.push(child)
		}
	})
	return items
}

/** Text of the first child when that child is an identifier (e.g. `--x` in `var(--x)`) */
export function get_first_identifier(node: CSSNode): string | undefined {
	const first = node.first_child
	return first && is_identifier(first) ? first.text : undefined
}
