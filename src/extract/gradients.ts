import type { Value } from '@projectwallace/css-parser'
import { type CSSNode, is_function, walk_values } from '@projectwallace/css-parser'
import { type Match, to_match } from '../utils/location.ts'
import { is_gradient_function } from '../values/gradients.ts'

export function is_gradient(node: CSSNode): boolean {
	return is_function(node) && is_gradient_function(node.name)
}

export function extract_gradients(input: Value): Match[] {
	const found: Match[] = []
	walk_values(input, function (node) {
		if (is_gradient(node)) {
			found.push(to_match(node))
		}
	})
	return found
}
