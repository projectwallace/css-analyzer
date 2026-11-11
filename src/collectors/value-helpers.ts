import {
	type CSSNode,
	type Value,
	is_identifier,
	is_operator,
	is_string,
	str_index_of,
} from '@projectwallace/css-parser'
import type { DeclarationContext } from '../engine/types.ts'
import { unquote } from '../utils/string-utils.ts'
import { analyze_animation } from '../values/animations.ts'
import { keywords } from '../values/values.ts'

/**
 * Properties whose values are never searched for colors, units, gradients and keywords inside the
 * value, because their words are names, timings or plain numbers, not what the collectors look for:
 * `font-family: Black` (a font, not a color), `animation: red 1s` (an animation name, not a color),
 * `transition` and `animation` (names and timings; their durations and timing functions have their
 * own collectors) and `z-index` (a number). `colors()` also skips `animation-name`.
 */
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
