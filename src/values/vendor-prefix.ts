import { is_function, is_identifier, walk_values } from '@projectwallace/css-parser'
import { type ValueInput, as_value } from '../utils/input.ts'

/**
 * Find vendor prefixed identifiers and functions in a CSS value.
 * @returns The prefixed names, as written
 */
export function get_prefixed_values(input: ValueInput): string[] {
	const found: string[] = []
	walk_values(as_value(input), function (node) {
		// Identifiers and functions are the only vendor prefixed nodes a value can hold
		// (declarations, at-rules and pseudo selectors never appear in a value)
		if (node.is_vendor_prefixed && (is_identifier(node) || is_function(node))) {
			found.push(node.name)
		}
	})
	return found
}
