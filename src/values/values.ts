import { KeywordSet } from '../keyword-set.js'
import { Identifier, Nr, Dimension } from '../css-tree-node-types.js'
import type { Value } from 'css-tree'
import type { CSSNode } from '@projectwallace/css-parser'

export const keywords = new KeywordSet([
	'auto',
	'none', // for `text-shadow`, `box-shadow` and `background`
	'inherit',
	'initial',
	'unset',
	'revert',
	'revert-layer',
])

export function isValueKeyword(node: Value) {
	let children = node.children
	let size = children.size

	if (!children) return false
	if (size > 1 || size === 0) return false

	let firstChild = children.first
	return firstChild!.type === Identifier && keywords.has(firstChild.name)
}

function isZero(string: string): boolean {
	return parseFloat(string) === 0
}

/**
 * Test whether a value is a reset (0, 0px, -0.0e0 etc.)
 */
export function isValueReset(node: CSSNode): boolean {
	for (let child of node.children) {
		if (child.type_name === 'Number' && isZero(child.text)) continue
		if (child.type_name === 'Dimension' && child.value === 0) continue
		return false
	}

	return true
}
