import { KeywordSet } from '../keyword-set.js'
import { is_number, is_dimension, type Value } from '@projectwallace/css-parser'

export const keywords = new KeywordSet([
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
	for (let node of value) {
		if (is_number(node) && node.value === 0) continue
		if (is_dimension(node) && node.value === 0) continue
		return false
	}

	return true
}
