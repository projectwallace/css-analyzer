import { endsWith } from '../string-utils.js'
import { Identifier } from '../css-tree-node-types.js'
import type { Value } from '@eslint/css-tree'

export function isIe9Hack(node: Value): boolean {
	let children = node.children
	if (children) {
		let last = children.last
		return last && last.type === Identifier && endsWith('\\9', last.name) ? true : false
	}
	return false
}
