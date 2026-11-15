import { is_custom, is_identifier } from '@projectwallace/css-parser'
import { type ValueInput, as_value } from '../utils/input.ts'
import { type Match, to_match } from '../utils/location.ts'

export function get_anchor_names(input: ValueInput): Match[] {
	const names: Match[] = []
	as_value(input).for_each(function (node) {
		if (is_identifier(node) && is_custom(node.text)) {
			names.push(to_match(node))
		}
	})
	return names
}
