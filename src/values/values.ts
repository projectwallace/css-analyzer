import { KeywordSet } from '../keyword-set.js'
import type { CSSNode } from '@projectwallace/css-parser'
import { NUMBER, DIMENSION } from '@projectwallace/css-parser'

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
export function isValueReset(node: CSSNode): boolean {
	for (let child of node.children) {
		if (child.type === NUMBER && child.value === 0) continue
		if (child.type === DIMENSION && child.value === 0) continue
		return false
	}

	return true
}
