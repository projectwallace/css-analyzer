import { is_function, is_if_branch, str_equals, walk_values } from '@projectwallace/css-parser'
import { type ValueInput, as_value } from '../utils/input.ts'
import { type Match, to_match } from '../utils/location.ts'

export type IfFunction = Match & {
	/** Branches of the `if()`, `else` included */
	branches: number
	has_else: boolean
	/** `else` branches that are followed by another branch, which can then never be reached */
	misplaced_else: Match[]
}

/** Every `if()` function in a value (nested ones too), in source order. `value` is its text. */
export function get_if_functions(input: ValueInput): IfFunction[] {
	const found: IfFunction[] = []
	walk_values(as_value(input), function (node) {
		if (!is_function(node) || !str_equals('if', node.name)) {
			return
		}
		let branches = 0
		let has_else = false
		const misplaced_else: Match[] = []
		node.for_each(function (child) {
			if (!is_if_branch(child)) {
				return
			}
			branches++
			if (child.is_else) {
				has_else = true
				// Branches after an `else` are never reached
				if (child.has_next) {
					misplaced_else.push(to_match(child))
				}
			}
		})
		found.push({ ...to_match(node), branches, has_else, misplaced_else })
	})
	return found
}
