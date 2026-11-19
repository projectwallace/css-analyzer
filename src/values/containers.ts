import type { Value } from '@projectwallace/css-parser'
import { is_identifier, is_operator } from '@projectwallace/css-parser'
import { type Match, to_match } from '../utils/location.ts'
import { keywords } from './values.ts'

/** The container names of `container-name` and `container` (before the slash) */
export function get_declared_container_names(input: Value): Match[] {
	const names: Match[] = []
	input.for_each(function (node) {
		if (is_operator(node) && node.text === '/') {
			// What follows is the container type
			return false
		}
		if (is_identifier(node) && !keywords.has(node.name)) {
			names.push(to_match(node))
		}
	})
	return names
}
