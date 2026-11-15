import { is_atrule_prelude, is_layer_name, is_raw } from '@projectwallace/css-parser'
import { type PreludeInput, as_prelude } from '../utils/input.ts'
import { type Match, to_match, to_match_in_source } from '../utils/location.ts'
import { unquote } from '../utils/string-utils.ts'

/** The name in a `@keyframes` prelude, without quotes (`"my fade"` is `my fade`); `null` for an empty prelude */
export function get_keyframes_name(input: PreludeInput): Match | null {
	if (typeof input === 'string') {
		const name = input.trim()
		if (name === '') {
			return null
		}
		return to_match_in_source(input, input.indexOf(name), name.length, unquote(name))
	}
	const text = input.text
	return text === '' ? null : to_match(input, unquote(text))
}

/** The names in a `@layer` prelude (`a, b.c`): `@layer a, b;`, `@layer a { }` or the `layer(a)` of an import */
export function get_layer_names(input: PreludeInput): Match[] {
	const names: Match[] = []
	for (const node of as_prelude('layer', input)) {
		if (is_layer_name(node)) {
			names.push(to_match(node))
		} else if (is_raw(node)) {
			// The prelude was not parsed: read the names from its text, and move them to where the text is
			for (const name of get_layer_names(node.text)) {
				names.push({
					value: name.value,
					line: node.line + name.line - 1,
					column: name.line === 1 ? node.column + name.column - 1 : name.column,
					offset: node.start + name.offset,
					length: name.length,
				})
			}
		} else if (is_atrule_prelude(node)) {
			node.for_each(function (child) {
				if (is_layer_name(child)) {
					names.push(to_match(child))
				}
			})
		}
	}
	return names
}
