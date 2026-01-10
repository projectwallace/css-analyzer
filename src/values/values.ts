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

export function isValueKeywordWallace(node: CSSNode) {
	if (!node.has_children) return false
	let size = node.children.length
	if (size > 1 || size === 0) return false
	return node.first_child?.type_name === 'Identifier' && keywords.has(node.first_child.name)
}

function isZero(string: string): boolean {
	return parseFloat(string) === 0
}

/**
 * Test whether a value is a reset (0, 0px, -0.0e0 etc.)
 */
export function isValueReset(node: Value): boolean {
	for (let child of node.children.toArray()) {
		if (child.type === Nr && isZero(child.value)) continue
		if (child.type === Dimension && isZero(child.value)) continue
		return false
	}

	return true
}
