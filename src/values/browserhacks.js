import { endsWith } from "../string-utils.js"
import { Identifier } from "../css-tree-node-types.js"

/**
 * @param {import('css-tree').Value} node
 */
export function isIe9Hack(node) {
	let children = node.children
	if (children) {
		let last = children.last
		return last
			&& last.type === Identifier
			&& endsWith('\\9', last.name)
	}
	return false
}

/**
 * @param {import('css-tree').Value} node
 * @param {boolean|string} important  - // i.e. `property: value !ie`
 */
export function isBrowserhack(node, important) {
	return isIe9Hack(node) || typeof important === 'string'
}