import { is_identifier, is_operator } from '@projectwallace/css-parser'
import { type ValueInput, as_value } from '../utils/input.ts'
import { keywords } from './values.ts'

/**
 * The container names in a `container-name` value (`sidebar card`) or in a `container` shorthand
 * (`sidebar / inline-size`: only the part before the slash). `none` is not a name.
 */
export function get_declared_container_names(input: ValueInput): string[] {
	const names: string[] = []
	as_value(input).for_each(function (node) {
		if (is_operator(node) && node.text === '/') {
			// What follows is the container type
			return false
		}
		if (is_identifier(node) && !keywords.has(node.name)) {
			names.push(node.text)
		}
	})
	return names
}
