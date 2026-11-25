import {
	type CSSNode,
	type Value,
	OPERATOR,
	str_index_of,
	strip_value_hack,
} from '@projectwallace/css-parser'
import { keywords } from '../values/values.ts'

// Properties whose values are never searched for colors, gradients and keywords inside the value,
// because their words are names, timings or plain numbers, not what the extractors look for:
// `font-family: Black` (a font, not a color), `animation: red 1s` (an animation name, not a color),
// `transition` and `animation` (names and timings; their durations and timing functions have their
// own extractors) and `z-index` (a number). Colors also skip `animation-name`.
// Units are not in this list: `1s` and `200ms` are units too, so they only skip `font-family` and `z-index`.
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

/** The items of a comma/slash separated value, without the separators */
export function get_list_items(value: Value): CSSNode[] {
	const items: CSSNode[] = []
	value.for_each(function (child) {
		if (child.type !== OPERATOR) {
			items.push(child)
		}
	})
	return items
}

// The text of a value without its browserhack (`1px\9`), or `undefined` for a missing value and for
// global keywords (`inherit`, `none`, `auto`, ...): those say nothing about the property's own values.
// Custom properties keep their text as written.
export function get_clean_value_text(
	value: Value | undefined,
	is_custom: boolean,
): string | undefined {
	return value ? clean_value_text(value.text, is_custom) : undefined
}

/** `get_clean_value_text` for a value's text that is already read: saves reading `value.text` twice */
export function clean_value_text(text: string, is_custom: boolean): string | undefined {
	// Strip the hack first: `inherit\9` is still a global keyword
	const clean = is_custom ? text : strip_value_hack(text)
	return keywords.has(clean) ? undefined : clean
}
