import type { Value } from '@projectwallace/css-parser'
import { is_function, is_identifier, walk_values } from '@projectwallace/css-parser'
import { type Match, to_match } from '../utils/location.ts'

/** Find vendor prefixed identifiers and functions */
export function get_prefixed_values(input: Value): Match[] {
	const found: Match[] = []
	walk_values(input, function (node) {
		// Identifiers and functions are the only vendor prefixed nodes a value can hold
		// (declarations, at-rules and pseudo selectors never appear in a value)
		if (node.is_vendor_prefixed && (is_identifier(node) || is_function(node))) {
			found.push(to_match(node, node.name, node.name.length))
		}
	})
	return found
}
