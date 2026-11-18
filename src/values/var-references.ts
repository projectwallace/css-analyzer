import {
	is_custom,
	is_function,
	is_identifier,
	str_equals,
	walk_values,
} from '@projectwallace/css-parser'
import { type ValueInput, as_value } from '../utils/input.ts'
import { type Match, to_match } from '../utils/location.ts'

/** The custom properties a value reads with `var()`, also inside fallbacks and other functions */
export function get_var_references(input: ValueInput): Match[] {
	const found: Match[] = []
	walk_values(as_value(input), function (node) {
		if (is_function(node) && str_equals('var', node.name)) {
			const first = node.first_child
			if (first !== null && is_identifier(first) && is_custom(first.text)) {
				found.push(to_match(first))
			}
		}
	})
	return found
}
