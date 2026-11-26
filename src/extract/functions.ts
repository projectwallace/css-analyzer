import {
	type CSSNode,
	type Value,
	is_atrule,
	is_function,
	str_equals,
	walk_values,
} from '@projectwallace/css-parser'
import { to_match } from '../utils/location.ts'
import { type CustomMatch, get_prelude_name } from './mixins.ts'

/** `--name()` in a value is a use of a custom function */
export function get_function_usage(node: CSSNode): CustomMatch | null {
	if (!is_function(node) || !node.name.startsWith('--')) {
		return null
	}
	// The match covers the name only: `--name`
	return { ...to_match(node, { length: node.name.length }), name: node.name, kind: 'usage' }
}

/** `@function --name()` is a definition (give it the at-rule); `--name()` in a value (give it the value) a usage */
export function extract_functions(node: Value | CSSNode): CustomMatch[] {
	if (is_atrule(node)) {
		const match = str_equals('function', node.name) && get_prelude_name(node)
		return match ? [{ ...match, kind: 'definition' }] : []
	}
	const found: CustomMatch[] = []
	walk_values(node as Value, function (child) {
		const usage = get_function_usage(child)
		if (usage) {
			found.push(usage)
		}
	})
	return found
}
