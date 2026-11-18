import {
	type CSSNode,
	is_atrule_prelude,
	is_function,
	is_layer_name,
	is_raw,
	str_equals,
} from '@projectwallace/css-parser'
import { type PreludeInput, as_prelude } from '../utils/input.ts'
import { type Match, to_match, to_match_in_source } from '../utils/location.ts'
import { unquote } from '../utils/string-utils.ts'

/** The name in a `@keyframes` prelude, without quotes */
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

/** The names in a `@layer` prelude */
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

/** The custom property name in a `@property` prelude, as written (it does not have to start with `--`) */
export function get_property_name(input: PreludeInput): Match | null {
	if (typeof input === 'string') {
		const name = input.trim()
		return name === '' ? null : to_match_in_source(input, input.indexOf(name), name.length, name)
	}
	const text = input.text.trim()
	return text === '' ? null : to_match(input, text)
}

/**
 * The layer of an `@import` prelude: `layer(name)` gives the name, a bare `layer` or `layer()` is an
 * anonymous layer (an empty `value`). `null` when the import has no layer.
 */
export function get_import_layer(input: PreludeInput): Match | null {
	let found: Match | null = null
	function read(node: CSSNode): void {
		if (found) {
			return
		}
		if (is_layer_name(node)) {
			found = to_match(node, node.name || '')
		} else if (is_function(node) && str_equals('layer', node.name)) {
			const name = node.first_child
			found =
				name && is_layer_name(name) && name.name ? to_match(name, name.name) : to_match(node, '')
		}
	}
	for (const node of as_prelude('import', input)) {
		if (is_atrule_prelude(node)) {
			node.for_each(read)
		} else {
			read(node)
		}
	}
	return found
}
