import {
	type CSSNode,
	is_function,
	property_basename,
	walk_values,
} from '@projectwallace/css-parser'
import { type ValueInput, as_value } from '../utils/input.ts'
import { type Match, to_match } from '../utils/location.ts'
import { is_gradient_function } from '../values/gradients.ts'
import { no_value_walk } from './shared.ts'

// A gradient function in a value of `property` (the normalized name): values of `font-family`,
// `transition`, `animation` and `z-index` hold no gradients.
export function is_gradient(node: CSSNode, property: string): boolean {
	return !no_value_walk.has(property) && is_function(node) && is_gradient_function(node.name)
}

export function extract_gradients(property: string, input: ValueInput): Match[] {
	const name = property_basename(property)
	const found: Match[] = []
	walk_values(as_value(input), function (node) {
		if (is_gradient(node, name)) {
			found.push(to_match(node))
		}
	})
	return found
}
