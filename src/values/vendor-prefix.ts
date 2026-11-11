import { is_function, is_identifier, walk_values } from '@projectwallace/css-parser'
import { type ValueInput, as_value } from '../utils/input.ts'

/**
 * Find vendor prefixed identifiers and functions in a CSS value.
 * @returns The prefixed names, as written
 */
export function get_prefixed_values(input: ValueInput): string[] {
	const found: string[] = []
	walk_values(as_value(input), function (node) {
		if (node.is_vendor_prefixed) {
			// .name in case of Identifier or Function, .text as fallback
			if (is_identifier(node) || is_function(node)) {
				found.push(node.name)
			} else {
				found.push(node.text)
			}
		}
	})
	return found
}
