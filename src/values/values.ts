import { is_number, is_dimension } from '@projectwallace/css-parser'
import { type ValueInput, as_value } from '../utils/input.ts'
import { KeywordSet } from '../utils/collections/keyword-set.ts'

export const keywords: KeywordSet = new KeywordSet([
	'auto',
	'none', // for `text-shadow`, `box-shadow` and `background`
	'inherit',
	'initial',
	'unset',
	'revert',
	'revert-layer',
])

/**
 * Test whether a value is a reset (0, 0px, -0.0e0 etc.)
 */
export function is_value_reset(input: ValueInput): boolean {
	let is_reset = true
	as_value(input).for_each(function (node) {
		if ((is_number(node) || is_dimension(node)) && node.value === 0) {
			return
		}
		is_reset = false
		return false
	})

	return is_reset
}
