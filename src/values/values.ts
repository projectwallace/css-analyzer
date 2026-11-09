import { is_number, is_dimension, type Value } from '@projectwallace/css-parser'
import { KeywordSet } from '../keyword-set.ts'

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
export function isValueReset(value: Value): boolean {
	let is_reset = true
	value.for_each((node) => {
		if (is_number(node) && node.value === 0) {
			return
		}
		if (is_dimension(node) && node.value === 0) {
			return
		}
		is_reset = false
		return false
	})

	return is_reset
}
