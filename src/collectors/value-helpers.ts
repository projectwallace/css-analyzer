import {
	type CSSNode,
	type Value,
	is_identifier,
	is_operator,
	str_index_of,
} from '@projectwallace/css-parser'
import type { DeclarationContext } from '../engine/types.ts'
import { unquote } from '../utils/string-utils.ts'
import { analyze_animation, get_animation_names } from '../values/animations.ts'

// Properties whose values are never searched for colors, gradients and keywords inside the value,
// because their words are names, timings or plain numbers, not what the collectors look for:
// `font-family: Black` (a font, not a color), `animation: red 1s` (an animation name, not a color),
// `transition` and `animation` (names and timings; their durations and timing functions have their
// own collectors) and `z-index` (a number). `colors()` also skips `animation-name`.
// `units()` is not in this list: `1s` and `200ms` are units too, so it only skips `font-family` and `z-index`.
export const no_value_walk: ReadonlySet<string> = new Set([
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
export function get_used_animation_names(ctx: DeclarationContext): string[] {
	if (ctx.clean_value_text === undefined) {
		return []
	}
	if (ctx.property === 'animation') {
		return analyze_animation(ctx.value!).names.map((match) => unquote(match.value))
	}
	return ctx.property === 'animation-name'
		? get_animation_names(ctx.value!).map((match) => match.value)
		: []
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
