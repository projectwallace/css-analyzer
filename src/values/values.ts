import type { Value } from '@projectwallace/css-parser'
import { is_number, is_dimension } from '@projectwallace/css-parser'
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

export function is_value_reset(input: Value): boolean {
	let is_reset = true
	input.for_each(function (node) {
		if ((is_number(node) || is_dimension(node)) && node.value === 0) {
			return
		}
		is_reset = false
		return false
	})

	return is_reset
}
