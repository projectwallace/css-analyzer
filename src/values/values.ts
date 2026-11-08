import { is_number, is_dimension } from '@projectwallace/css-parser'
import { type ValueInput, as_value } from '../input.ts'
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
export function is_value_reset(input: ValueInput): boolean {
	for (const node of as_value(input)) {
		if (is_number(node) && node.value === 0) {
			continue
		}
		if (is_dimension(node) && node.value === 0) {
			continue
		}
		return false
	}

	return true
}
