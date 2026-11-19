import type { Value } from '@projectwallace/css-parser'
import { is_custom, is_identifier } from '@projectwallace/css-parser'
import { type Match, to_match } from '../utils/location.ts'

export function get_anchor_names(input: Value): Match[] {
	const names: Match[] = []
	input.for_each(function (node) {
		if (is_identifier(node) && is_custom(node.text)) {
			names.push(to_match(node))
		}
	})
	return names
}
